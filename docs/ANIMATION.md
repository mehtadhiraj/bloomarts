# Animation

## Principles applied

- **Transform and opacity only.** Both are compositor properties, so no
  animation in the theme triggers layout or paint during a scroll.
- **Nothing is load-bearing.** Every animated element is fully visible and
  fully usable in its final state before any animation runs. If JavaScript
  fails, nothing is stranded invisible.
- **No animation delays navigation.** There are no page-transition animations
  gating a click, no scroll-jacking, and no cursor hijacking.
- **No library.** All of it is native CSS plus roughly 60 lines of JavaScript
  using `IntersectionObserver`. No dependency was added.
- **Reveals are one-shot.** Each element is `unobserve`d the moment it
  reveals, so nothing keeps consuming callbacks after it has played.

## Two brake tiers

A single brake was wrong: it meant a phone got **no** animation at all, when
the requirement is to *reduce or simplify* resource-intensive animation on
smaller devices — simplify, not eliminate.

**`reduce-motion` — hard brake.** Everything stops, including cheap fades.
Triggered by: the merchant's master switch, `prefers-reduced-motion: reduce`,
`Save-Data`, or a 2G/slow-2G `effectiveType`.

**`simplify-motion` — soft brake.** Only the *expensive* effects stop:
parallax, blur resolve, text wipe, 3D tilt, gallery rotation, hero drift and
motif float. Cheap opacity/transform reveals keep running. Triggered by a
screen under 768px or `deviceMemory <= 4` / `hardwareConcurrency <= 4`, when
*Simplify motion on small or low-powered devices* is on.

`@media (prefers-reduced-motion: reduce)` backs both up at the CSS level as
the last word.

Missing signals are never read as "low powered" — `deviceMemory` and
`hardwareConcurrency` are absent in Safari, and treating absence as low-end
would disable motion for every iPhone.

The policy is **re-evaluated live**, not once at load. Evaluating only at
`DOMContentLoaded` meant a phone that loaded in portrait and rotated to
landscape stayed simplified for the whole session.

Missing signals are never read as "low powered" — `deviceMemory` and
`hardwareConcurrency` are absent in Safari, and treating absence as a low-end
device would disable motion for every iPhone.

## Theme settings

| Setting | Options | Effect |
|---|---|---|
| Enable animations | on/off | Master switch |
| Intensity | subtle / balanced / expressive | Drives reveal distance, duration, hover lift and zoom together |
| Section reveal | none / fade / rise / rise-stagger | How sections enter |
| Speed | 60–160% | `--motion-scale`, multiplied into **every** duration token |
| Slow zoom on hero images | on/off | 24s hero drift, desktop only |
| Product card hover | none / lift / zoom / swap / lift-zoom | Pointer devices only |
| Simplify on small/low-powered devices | on/off | Brake 2 above |

Speed is a single multiplier on `--dur-fast`/`--dur-base`/`--dur-slow` rather
than a per-component setting, so a component can never fall out of step with
the merchant's choice.

## What is animated

| Element | Motion |
|---|---|
| Sections | Fade + rise on entry, staggered per group (capped at 6 steps), **reversible** |
| Hero image | 24s scale drift — desktop and pointer-fine only |
| Hero content | Staggered rise |
| Product cards | Lift + image zoom + underline draw — **hover-capable pointers only** |
| Buttons | Colour shift, 1px lift, 0.975 press scale |
| Cart badge | One 520ms bump per add — a confirmation, not a loop |
| Drawers / sheets | Slide from edge, overlay fade |
| Sticky add-to-cart | Slide up on reveal |
| Accordions | Chevron rotation |
| Loading | Skeleton shimmer |
| Brand motifs | 9–14s float — desktop only |

## Reveals reverse on scroll

Section reveals are driven by **scroll position**, not fired once by an
observer. Scrolling back up runs them backwards, and scrolling down again
replays them.

The earlier implementation used `IntersectionObserver` with `unobserve()`
after the first hit, which meant a reveal played exactly once per page load —
scrolling back up and down showed nothing. Re-observing would have worked, but
it costs continuous observer traffic and, worse, re-hides content the reader
has already seen.

The observer path still exists as the **fallback** for browsers without
scroll-driven animations, where it necessarily remains one-shot. Merchants who
prefer that behaviour everywhere can tick **Play section reveals only once**.

Because a scroll timeline has no wall clock, the stagger is expressed as an
offset into the animation *range* — each item starts a little further along
the scroll — rather than as `animation-delay`.

## Scroll-driven effects

Separate from the IntersectionObserver reveals above. These use native CSS
scroll-driven animations (`animation-timeline`), which the compositor
evaluates off the main thread. The JavaScript alternative — a scroll listener
reading layout and writing transforms every frame — is exactly what makes
parallax feel broken on a mid-range Android.

All of it sits inside `@supports (animation-timeline: view())`. Browsers
without support get the static layout, which is complete on its own. There is
deliberately **no JS fallback**: emulating this with a scroll handler would
reintroduce the cost the feature exists to avoid.

| Effect | Hook | Gate |
|---|---|---|
| Parallax media | `.parallax-media` | scroll effects on |
| Scroll-linked enter | `[data-scroll-enter]` | scroll effects on |
| Scroll-linked exit | `[data-scroll-exit]` | rich only |
| Blur-to-sharp resolve | `[data-scroll-reveal="blur"]` | **768px and up only** |
| Gradient text wipe | `[data-scroll-reveal="wipe"]` | scroll effects on |
| Ghost display word | `.ghost-word` | drift on 768px+ |
| Heading rule draw | `.section-head::after` | scroll effects on |
| Scroll progress bar | `.scroll-progress` | opt-in setting |

Two of these carry a caveat worth knowing:

- **Blur is not compositor-cheap.** Unlike `transform` and `opacity`,
  animating `filter: blur()` forces repaints, and a full-width blurred heading
  is genuinely expensive on a mobile GPU. It is restricted to 768px and up.
- **The text wipe uses `background-clip: text`,** which needs a transparent
  text colour. The entire rule is nested inside the `@supports` block so a
  browser that cannot run the animation never applies the clip and renders
  ordinary text. The unrevealed portion is 28% of `currentColor`, never fully
  transparent, and every brake explicitly restores `color: inherit`.

## 3D depth

| Effect | Where | Gate |
|---|---|---|
| Card tilt | `assets/depth.js` + `scroll-effects.css` | `(hover: hover) and (pointer: fine)` |
| Card media / title on separate Z planes | `.card__media`, `.card__body` | same |
| Gallery rotation | `.gallery__slide` | `view(inline)`, pointer-fine |
| Button press depth | `.btn--primary:active` | pointer-fine |

`depth.js` returns immediately unless the merchant setting is on. It uses one
delegated listener rather than one per card, reads layout at most once per
pointer-enter (and once after a scroll) rather than per frame, and batches
writes into `requestAnimationFrame` so reads and writes never interleave.
JavaScript only sets custom properties — the transform that consumes them
lives in CSS, so the browser interpolates it.

**None of this runs on touch.** Every rule is behind `(hover: hover) and
(pointer: fine)`, so a phone never attaches a listener or evaluates a rule.

## Smooth scroll (Lenis) — not added

The client's reference site uses Lenis, which intercepts wheel events and
animates scroll position. That is scroll hijacking, which this project's brief
explicitly forbids, and a third-party dependency the same brief says needs
approval. It also breaks native scrollbar dragging and fights `scroll-snap` —
which the product gallery and featured carousel both depend on.

Native `scroll-behavior: smooth` is used instead. Adopting Lenis would mean
the client knowingly overriding their own constraint.

## Why hover effects cost mobile nothing

Every hover rule is inside `@media (hover: hover) and (pointer: fine)`. A touch
device never matches, so those rules are never evaluated — and the card's
second image is never decoded there either.

## Layout shift

No animation changes layout. Reveals animate `opacity` and `translate3d`;
the element's box is its final size the whole time. The sticky add-to-cart bar
is `position: fixed` and the product template reserves matching bottom padding
on the footer statically, so the bar's appearance moves nothing.
