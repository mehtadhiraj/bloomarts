# Mobile validation report

Bloom Arts theme — validated 30 August 2026.

---

## How this was validated, and what that is worth

There is no Shopify store for this theme yet, so it was validated against a
local harness (`dev/render.mjs`) that renders the **real theme Liquid** with
LiquidJS plus shims for the Shopify-specific filters and tags the theme uses.
Pages were then driven in Chrome at ten viewport widths inside an iframe, which
gives a genuine narrow viewport for media queries and `vw`/`svh` units —
something window resizing cannot do below about 400px on macOS.

**What this proves:** layout, reflow, touch-target geometry, colour contrast,
reserved space, and the DOM/ARIA structure of every component, at real widths.

**What it does not prove:** anything that needs Shopify itself — cart mutations
against the Cart API, Section Rendering responses, native checkout handoff, app
blocks, real image CDN behaviour, or Shopify's own Liquid rendering. Those are
listed as **unverified** below rather than quietly claimed.

Two further limits worth stating plainly:

- The Chrome window used for testing was backgrounded, which suspends
  `IntersectionObserver` entirely. Scroll-driven behaviour (sticky bar reveal,
  section reveals, gallery position tracking) was therefore verified by driving
  the components' own state transitions and asserting the resulting classes,
  ARIA and computed styles — not by real scrolling. The observer *wiring* was
  asserted; observer *delivery* is browser behaviour.
- Contrast over a gradient or photograph cannot be sampled from computed
  style. Those cases are counted separately and were computed by hand instead.

---

## 1. Responsive layout

Automated sweep across `index`, `collection`, `product`, `cart`, `search`,
`page` at **320, 360, 375, 390, 414, 768, 820, 1024, 1280, 1440**.

| Check | Result |
|---|---|
| Horizontal overflow (`scrollWidth > clientWidth`) | **0** at every page × width |
| Text clipped by an `overflow:hidden` ancestor | **0** |
| Overlapping or broken sections | none observed |

Every media query in the theme is `min-width`. The rules outside a media query
*are* the mobile rules — there is no desktop rule that a smaller breakpoint has
to undo.

Grid children carry `minmax(0, 1fr)` rather than `1fr`; a grid item's default
`min-width: auto` is what lets one long product title widen a column and push a
row past a 320px viewport.

### Bugs found and fixed during this sweep

| Issue | Fix |
|---|---|
| A square logo sized only by `width` rendered 180px tall and inflated the header, dragging every sticky offset with it | Constrained on both axes with `max-height` |
| Cart line-item properties used an `auto` label column; inside a narrow cart line at 320px the value column collapsed to ~8px and a filename wrapped one character per line into a 576px-tall link | Properties now stack instead of using two columns |
| `--color-border` contained a Cyrillic `а` (U+0430), silently invalidating the hex | Replaced with ASCII; `scripts/check-theme.mjs` now fails on non-ASCII inside any CSS declaration |
| `From₹2,450` and `Size:Ø22 cm` — Liquid whitespace control stripped the separating space | Explicit `&nbsp;` |

---

## 2. Touch behaviour and target sizes

Standard applied: **44 × 44 px minimum**, WCAG 2.5.5 (stricter than 2.5.8's
24px). Audited on every page at every width.

| Result | Count |
|---|---|
| Interactive elements audited per page | 60–140 |
| Under 44px after fixes | **0** |

Exemptions applied, and why:
- Links inline within a sentence (WCAG 2.5.8 explicitly exempts these). This
  covers Shopify's injected `powered_by_link`, which the theme cannot restyle
  meaningfully without breaking the sentence.
- Controls inside a wrapper that is itself ≥44px — the row is the target.

### Fixed during audit

| Element | Was | Now |
|---|---|---|
| Announcement bar link | 36px tall | 44px |
| Footer `<summary>` at ≥768px | 25.6px — still focusable and activatable | 44px |
| Quantity input between two 44px steppers | 30 × 26px | 44 × 44px |
| Header logo link | 36px wide | 44px both axes |
| Cart line-item title link | 20.8px tall | 44px |

### Touch details

- `touch-action: manipulation` on buttons and links removes the 300ms tap
  delay **without** disabling pinch-zoom on the page.
- `-webkit-tap-highlight-color: transparent`, with `:active` and
  `:focus-visible` carrying the feedback instead.
- No `maximum-scale` or `user-scalable=no` — pinch zoom stays available.
- Bottom sheets dismiss by dragging the grab handle down; the handle is a full
  44px drag surface even though the visible pill is 4px.
- `overscroll-behavior: contain` on every scrollable panel stops scroll
  chaining to the page behind.
- Scroll locking pins `<body>` with `position: fixed` and restores the offset.
  `overflow: hidden` alone does not hold on iOS Safari — the page rubber-bands
  behind the drawer and loses its position.

---

## 3. Performance

Measured from the built theme.

| Page | HTML | CSS (gzip) | JS (gzip) | JS files |
|---|---|---|---|---|
| Home | 80 kB | 17.1 kB | ~9 kB | 4 |
| Product | 75 kB | ~18 kB | **14.1 kB** | 7 |
| Collection | 74 kB | ~17 kB | ~9 kB | 4 |
| Cart | 52 kB | ~13 kB | ~10 kB | 5 |

**Total JavaScript across the entire theme: 58 kB raw, 14.6 kB gzipped.** No
framework, no bundler, no runtime dependency. For comparison, that is smaller
than most themes' analytics shim.

- All JS is `defer`red; nothing above the fold depends on it.
- Components are self-registering custom elements — no module graph to resolve
  and no import waterfall on a high-latency mobile connection.
- `content-visibility: auto` with `contain-intrinsic-size` on below-fold
  sections skips their rendering work while keeping the scrollbar stable.
- Settings-derived tokens are inlined in `<head>`, so first paint already has
  the right colours and `base.css` stays byte-identical (and cacheable) across
  stores.
- `preconnect` to the Shopify image CDN before the hero `srcset` resolves.
- Predictive search debounces at 250ms, or **600ms with 4 results instead of 6**
  when `Save-Data` or a 2G `effectiveType` is reported, and aborts in-flight
  requests so a slow early response cannot overwrite a fast later one.

**Known tradeoff:** 14–16 separate stylesheet requests per page, because each
section loads its own component CSS and there is no build step to concatenate
them (Shopify's GitHub integration cannot run one). On HTTP/2 this is
acceptable, but it is the clearest remaining performance win — see *Not done*.

**Not measured:** real Core Web Vitals. LCP, INP and field CLS need a real
store with real images on real connections. The structural CLS causes are
addressed below, but the numbers themselves are unverified.

---

## 4. Responsive images

| Check | Result |
|---|---|
| Images with `width` + `height` | **100%** |
| Images with `srcset` (or inside `<picture>`) | **100%** |
| Images with an `alt` attribute | **100%** |

Every content image goes through `snippets/responsive-image.liquid` — a bare
`<img>` anywhere else is a bug. It emits Shopify CDN `srcset` candidates, a
`sizes` hint written **mobile-case-first**, intrinsic dimensions, `loading`,
`fetchpriority` and `decoding`.

Art direction uses `snippets/art-directed-image.liquid`: the hero ships a
genuinely different portrait crop below 768px rather than scaling a 16:9 banner
down, where the subject would become a thumbnail.

Loading priorities: hero and first gallery image `eager` + `fetchpriority=high`;
first four collection cards `eager`; everything else `lazy`.

### Layout shift prevention

- Every image has a reserved box from its intrinsic attributes or an explicit
  `aspect-ratio`.
- The Instagram grid's tiles are fixed 1:1 boxes that exist **before** any
  content arrives, so a late embed or app block drops into space already
  accounted for. This is the classic mobile CLS cause and it is designed out.
- The announcement bar has a reserved minimum height and clamps to one line on
  mobile.
- Fonts use `font_display: swap` behind a metric-adjusted fallback face with
  `ascent-override` / `descent-override` / `line-gap-override`, so the swap
  does not change line-box height.
- The sticky add-to-cart bar is `position: fixed` and the product template
  reserves matching footer padding **statically** — nothing is added or removed
  as it appears.

---

## 5. Navigation

| Surface | Mobile treatment |
|---|---|
| Main menu | Bottom sheet, links in thumb reach, account pinned at the bottom |
| Sub-menus | Expand in place inside native `<details>` — no JS, keeps context |
| Search | Full-height sheet so the keyboard cannot crush the results |
| Filters + sort | One bottom sheet with an explicit Apply |
| Cart | Bottom sheet, checkout nearest the thumb |

- Focus is trapped in every sheet, background content gets `inert` (which
  removes it from the accessibility tree, not just the tab order), and Escape
  and overlay-tap both dismiss.
- Focus returns to the opener on close.
- The desktop inline nav is **not rendered at all** below 1024px — a phone never
  downloads a second copy of the menu.
- The filter markup is rendered **once** and repositioned by CSS into a desktop
  sidebar, so there is never a second set of controls to drift out of sync.
- `interactive-widget=resizes-content` makes the virtual keyboard shrink the
  viewport rather than float over a focused field.
- Safe-area insets are applied to the header, sheets, sticky bar and footer;
  gutters include `env(safe-area-inset-left/right)` so content clears the notch
  in landscape.
- `dvh`/`svh` throughout — never `100vh`, which breaks when the mobile URL bar
  collapses.

Full desktop→mobile mapping: [`docs/MOBILE-ADAPTATIONS.md`](docs/MOBILE-ADAPTATIONS.md).

---

## 6. Product customization

All five input types verified on touch at 320–768px: colour swatches, short
text, long text, dropdown, file upload.

| Behaviour | Result |
|---|---|
| Required-field validation | ✅ Error summary + per-field message |
| Error summary links to the offending field | ✅ (`#custom-custom-base`) |
| `aria-invalid` set on failure, cleared on correction | ✅ |
| Live character counter | ✅ "14 characters remaining" for 10/24 chars |
| Inline errors tied via `aria-describedby` | ✅ |
| File type/size rejected before submit | ✅ |
| No blocking `alert()` anywhere | ✅ |

- Swatches are real `<input type="radio">` under a visual label, so keyboard and
  screen-reader behaviour comes from the platform rather than being rebuilt.
  Selection is signalled by **two** cues (ring + inset shadow), not colour alone.
- Dropdowns are native `<select>` — mobile browsers render these as a
  full-screen wheel that is already thumb-friendly and correctly announced.
- All text inputs are ≥16px; anything smaller makes iOS Safari zoom the viewport
  on focus, which reads as the layout breaking.
- `inputmode` and `enterkeyhint` are set per field (numeric keypad for
  quantity, decimal for price filters, email keyboard + Go for the newsletter).
- The file input is visually hidden behind a styled 44px label so the OS
  file/camera picker still opens, with filename and size shown after selection.
- The form is `multipart/form-data` and submits via `FormData`, which is the
  only body type that can carry an uploaded reference image alongside the line
  item properties.
- Everything posts as a **line item property**, so it travels into the cart and
  the order with no app dependency.

**Unverified:** that Shopify accepts the uploaded file and surfaces it on the
order. That needs a real store.

---

## 7. Cart experience

| Behaviour | Status |
|---|---|
| Drawer opens as a bottom sheet on mobile, side panel ≥768px | ✅ verified |
| Customization properties shown in full on every line | ✅ verified |
| Quantity stepper with 44px controls | ✅ verified |
| Separate remove control | ✅ verified |
| Checkout is a native POST with `name="checkout"` | ✅ verified in markup |
| Cart mutations via the Cart API | ⚠️ **unverified — needs a store** |
| Section Rendering API refresh | ⚠️ **unverified — needs a store** |

Customization properties are **never** truncated or hidden on small screens.
What someone typed as an engraving or uploaded as a reference is the reason
they are buying; hiding it to tidy the mobile layout would remove exactly the
detail they most need to check before paying.

Updated markup always comes from Liquid via the Section Rendering API rather
than being rebuilt in JavaScript — a second copy of the line-item template
would silently drift from the first.

**No JavaScript stands between the customer and checkout.** The checkout button
is a plain form submit, so a script failure cannot trap anyone at the cart.

---

## 8. Animation performance

| Principle | Applied |
|---|---|
| `transform` / `opacity` only | ✅ nothing triggers layout or paint on scroll |
| `IntersectionObserver`, no scroll handlers | ✅ |
| Reveals unobserve after firing | ✅ no ongoing cost |
| `prefers-reduced-motion` honoured | ✅ |
| Simplified on low-powered devices | ✅ |
| No animation library | ✅ ~60 lines of JS |
| Nothing load-bearing | ✅ content visible before any animation |
| No CLS from animation | ✅ boxes are final size throughout |

**Three independent brakes**, any one of which simplifies motion: the
merchant's master switch, the device-capability class, and the OS-level media
query.

Capability signals: `prefers-reduced-motion`, `Save-Data`, 2G `effectiveType`,
`deviceMemory ≤ 4`, `hardwareConcurrency ≤ 4`, and screens under 768px.
**Missing signals are never read as low-powered** — `deviceMemory` and
`hardwareConcurrency` are absent in Safari, and treating absence as low-end
would disable motion for every iPhone.

Verified at 390px: `reduce-motion` is applied automatically, hero drift and
motif float are off, and reveals resolve to fully visible.

Every hover effect sits inside `@media (hover: hover) and (pointer: fine)`, so
a touch device never evaluates those rules and never decodes the card's second
image.

**The reveal system fails safe.** Elements are authored *visible*; the class
that hides them for animation is only added after JS confirms motion is allowed
*and* `IntersectionObserver` exists. If the script never loads, content is
simply visible — nothing can strand at `opacity: 0`.

### Fixed during validation

- The sticky bar was hidden whenever the footer was in view, which in practice
  suppressed it for most of the page. Replaced with static footer padding.
- Under `reduce-motion` the bar's `visibility` delay was not reset on reveal,
  so it faded in while still `visibility: hidden` and then popped.

---

## 9. Accessibility

- Semantic landmarks, skip link, single shared `aria-live` region (separate
  regions per component talk over each other).
- One `:focus-visible` treatment throughout — visible for keyboards, absent for
  mouse and touch.
- Gallery: focusable scroll container, arrow/Home/End keys, dots as real
  buttons with `aria-current`, position announced politely.
- Colour is never the only signal for state.
- All decorative motifs and icons are `aria-hidden`; accessible names live on
  the controls.

### Contrast

Audited programmatically against WCAG 2.2 AA on every page and width.

| Result | Count |
|---|---|
| Text failing AA | **0** |
| Unmeasurable (text over a gradient) | 9–13 per page |

The unmeasurable cases are: card titles, whose "gradient" is the 0-height
animated underline while the text actually sits on the cream card surface
(brown on cream, **14.1:1**); and hero text over the scrim, computed by hand —
brown at 72% over a *worst-case pure white* photograph still leaves cream text
at about **5.4:1**. The first attempt at 62% gives roughly 4.4:1 and fails,
which is why the default is 72%.

Four of the six brand colours fail AA as small text on cream. The token role
map is built so that constraint is structural rather than a rule someone has to
remember — full measured table in
[`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md).

**One audit bug worth recording:** Chrome resolves `color-mix()` to
`color(srgb 0.96 0.96 0.93)` with 0–1 floats, not `rgb()` with 0–255 integers.
Reading those as 0–255 made every mixed surface look near-black and produced
13 false contrast failures on the product page. `dev/audit.js` handles both.

---

## Not done / not verified

Being explicit about scope rather than implying more coverage than exists.

**Needs a real Shopify store:**
- Cart API mutations, Section Rendering, native checkout handoff
- Predictive search against `/search/suggest.json`
- App blocks (including the Instagram feed app)
- Real Core Web Vitals

**Not tested on real devices.** No iOS or Android hardware was available. iOS
Safari and Android Chrome behaviours were *designed for* (scroll lock, 16px
inputs, safe areas, `dvh`, keyboard resize) but not observed.

**`IntersectionObserver` delivery** was not observed under real scrolling — the
test browser window was backgrounded, which suspends it. Component state
transitions and observer wiring were asserted directly instead.

**Not built** — present in your brief, absent here, because they were outside
the approved plan and I did not want to expand scope silently:
blog and article templates, contact page, password page, gift-card template,
customer account templates, the dedicated Instagram gallery page, the page
loader, product metafield/metaobject architecture, price-affecting
customization, breadcrumbs, and product structured data.

**Clearest remaining performance win:** concatenating the 14–16 per-page
stylesheets. Doing it without a build step means either inlining critical CSS
in `theme.liquid` or maintaining one combined file by hand.

**Needs your input:** `assets/great-vibes-regular.woff2` is referenced but not
included — a binary font could not be fetched here. Without it the script
accent falls back to a system cursive; nothing else breaks. See
[`docs/FONTS.md`](docs/FONTS.md).
