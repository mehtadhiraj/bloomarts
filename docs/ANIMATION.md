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

## Three independent brakes

Any one of these simplifies motion:

1. `[data-animations="false"]` — the merchant's master switch.
2. `.reduce-motion` — set by `global.js` from device capability:
   `prefers-reduced-motion`, `Save-Data`, 2G/slow-2G `effectiveType`,
   `deviceMemory <= 4`, `hardwareConcurrency <= 4`, or a screen under 768px
   when *Simplify motion on small or low-powered devices* is on.
3. `@media (prefers-reduced-motion: reduce)` — the OS preference, last word.

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
| Sections | Fade + rise on entry, staggered per group (capped at 6 steps) |
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

## Why hover effects cost mobile nothing

Every hover rule is inside `@media (hover: hover) and (pointer: fine)`. A touch
device never matches, so those rules are never evaluated — and the card's
second image is never decoded there either.

## Layout shift

No animation changes layout. Reveals animate `opacity` and `translate3d`;
the element's box is its final size the whole time. The sticky add-to-cart bar
is `position: fixed` and the product template reserves matching bottom padding
on the footer statically, so the bar's appearance moves nothing.
