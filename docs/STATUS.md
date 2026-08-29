# Implementation status

**Read this and [`PROJECT-BRIEF.md`](PROJECT-BRIEF.md) before starting work.**
Together they hold the full context — no chat history needed.

Last updated: 30 August 2026.

| Status | Meaning |
|---|---|
| ✅ **Completed** | Built and verified |
| 🟡 **In progress** | Partly built; a known, named gap remains |
| ⬜ **Pending** | Not started, not blocked — can be picked up now |
| ⛔ **Blocked** | Cannot proceed without a client decision (§7) |

---

## Summary

| | Count |
|---|---|
| ✅ Completed | 61 |
| 🟡 In progress | 7 |
| ⬜ Pending | 21 |
| ⛔ Blocked | 6 |

**Next up, in priority order:** customer account templates → contact page →
blog/article → structured data + breadcrumbs → page loader → CSS bundling.

---

## 1. Brief A — mobile-first requirements

| Requirement | Status | Where / gap |
|---|---|---|
| Polished across mobile/tablet/laptop/desktop | ✅ | Swept 320–1440px, 0 failures |
| Mobile-first nav, discovery, customization, cart, checkout handoff | ✅ | `sections/`, `snippets/` |
| No horizontal scroll / overlap / clipped text | ✅ | 0 across all pages × widths |
| Responsive desktop + mobile images | ✅ | `snippets/responsive-image.liquid`, `art-directed-image.liquid` |
| Accessible touch targets | ✅ | 44px floor, 0 violations |
| Sticky mobile add-to-cart (approved) | ✅ | `snippets/sticky-atc.liquid`, `assets/sticky-atc.js` |
| Swipe-friendly gallery with accessible controls | ✅ | CSS scroll-snap + dots/arrows/keyboard |
| Customization inputs work on touch | ✅ | `snippets/customization-field.liquid` |
| One-handed menu/search/filters/cart/accordions | ✅ | Bottom sheets throughout |
| Smooth, lightweight animation on mobile | ✅ | Two-tier motion policy |
| Simplify animation on small / low-powered devices | ✅ | `simplify-motion` class — expensive effects only |
| Optimise fonts, JS, images for slow connections | ✅ | 14.6 kB JS gzipped, subset woff2 |
| Optimise CSS delivery | 🟡 | **14–16 stylesheet requests per page**; needs bundling |
| Prevent layout shift | ✅ | Reserved boxes, metric-adjusted fallback font |
| Safe areas, virtual keyboard, orientation, sticky elements | ✅ | `env(safe-area-*)`, `interactive-widget`, `dvh/svh` |
| Test 320/375/390/414/768/1024/larger | ✅ | `MOBILE-VALIDATION.md` |
| Test on real iPhone / Android | ⬜ | No hardware available |
| Contrast + readability at every size | ✅ | 0 failures; `DESIGN-SYSTEM.md` |
| Don't hide essential info on mobile | ✅ | Cart properties shown in full |
| Document adapted mobile interactions | ✅ | `MOBILE-ADAPTATIONS.md` |
| Validation report covering all 8 areas | ✅ | `MOBILE-VALIDATION.md` |

---

## 2. Templates

| Template | Status | File |
|---|---|---|
| Homepage | ✅ | `templates/index.json` |
| Product | ✅ | `templates/product.json` |
| Collection | ✅ | `templates/collection.json` |
| Cart page | ✅ | `templates/cart.json` |
| Cart drawer | ✅ | `sections/cart-drawer.liquid` |
| Standard page | ✅ | `templates/page.json` |
| Search | ✅ | `templates/search.json` |
| 404 | ✅ | `templates/404.json` |
| List collections | ⬜ | — |
| Blog | ⬜ | — |
| Article | ⬜ | — |
| Contact page | ⬜ | — |
| Password | ⬜ | — |
| Gift card | ⬜ | — |
| Customer accounts (7 templates) | ⬜ | login, register, account, order, addresses, reset_password, activate_account |
| Instagram gallery page | ⛔ | App not chosen — §7.2 |

---

## 3. Systems

| Area | Status | Notes |
|---|---|---|
| OS 2.0 sections + blocks | ✅ | 14 sections, valid schemas |
| Global settings single source of truth | ✅ | `settings_schema.json` → CSS custom properties |
| Brand colours as contrast-checked tokens | ✅ | `DESIGN-SYSTEM.md` |
| Typography (Lora / Great Vibes / Poppins) | ✅ | Great Vibes bundled, 29 kB latin subset |
| Logo / mobile logo / favicon / share image | ✅ | Brand settings group |
| Button styles setting | ✅ | pill / soft / square |
| Global radius + spacing settings | ✅ | `corner_style`, `section_spacing` |
| Social links + Instagram handle | ✅ | Social settings group |
| Animation settings | ✅ | 11 settings, no per-effect bloat |
| Header: logo, width, nav, sticky, search, cart, account | ✅ | `sections/header.liquid` |
| Header: transparent-over-hero, colours, alignment, spacing | ⬜ | — |
| Announcement bar | ✅ | — |
| Hero: images, alt, copy, buttons, overlay, height, motifs | ✅ | — |
| Hero: text alignment, colour scheme | ⬜ | — |
| Featured collection | ✅ | Carousel on mobile, grid on desktop |
| Brand story (image with text) | ✅ | — |
| Instagram section | 🟡 | Markup + reserved tiles + `@app` block; no app wired |
| Newsletter | ✅ | In footer |
| Testimonials | ⬜ | — |
| FAQ | ⬜ | — |
| Customisable-products showcase | ⬜ | — |
| Per-section colour schemes | ⬜ | Global colours only — §7.7 |
| SEO metadata, OG, canonical | ✅ | `snippets/meta-tags.liquid` |
| Product structured data (JSON-LD) | ⬜ | — |
| Breadcrumbs | ⬜ | — |
| Translation-ready locales | ✅ | `locales/en.default.json` |
| App block support | 🟡 | `@app` in `instagram-feed` only; not in product/collection |
| Page loader | ⛔ | Needs client decisions — §7.5 |
| ZIP under 50 MB, folders at root | ✅ | 0.14 MB, `npm run package` |
| Official Shopify Theme Check | 🟡 | Custom `scripts/check-theme.mjs` passes; official CLI check not run |

---

## 4. Product customization

| Piece | Status |
|---|---|
| Five input types (swatch, text, textarea, select, file) | ✅ |
| Configurable per product without editing Liquid | ✅ Theme-editor blocks |
| Label, type, required, placeholder, help text, max length, choices | ✅ |
| Values flow to cart, drawer and order | ✅ Line item properties |
| Client-side validation + error summary | ✅ |
| File upload (multipart, type/size checked) | ✅ |
| Display order | 🟡 Block order in the editor; no explicit index |
| Min/max value, default value, custom validation rule | ⬜ |
| Conditional visibility | ⬜ |
| Editing customization from the cart | ⬜ |
| Metafield / metaobject architecture | ⛔ §7.3 |
| **Price adjustment** | ⛔ §7.3 |
| **Inventory effect** | ⛔ §7.3 |

---

## 5. Animation, scroll effects and 3D

Client reference: **momentolegal.com** — inspected; uses Lenis smooth scroll,
`data-reveal` attributes, blur-to-sharp text resolve, gradient text wipes,
oversized ghost display type, and an intro splash loader.

| Effect | Status | Notes |
|---|---|---|
| Section reveals, **reversible on scroll** | ✅ | Scroll-timeline driven; replays scrolling back up |
| Reveals, one-shot fallback | ✅ | IntersectionObserver, for browsers without scroll timelines |
| Staggered reveals | ✅ | Range offset (scroll path) / delay (observer path) |
| Scroll-linked parallax media | ✅ | Hero + image-with-text |
| Scroll-linked enter / exit | ✅ | `[data-scroll-enter]`, `[data-scroll-exit]` |
| Blur-to-sharp resolve | ✅ | `[data-scroll-reveal="blur"]` — 768px+ only |
| Gradient text wipe | ✅ | `[data-scroll-reveal="wipe"]` |
| Ghost display word | ✅ | Opt-in, blank by default |
| Section heading rule draw | ✅ | `.section-head::after` |
| Scroll progress bar | ✅ | Off by default |
| Back-to-top | ✅ | Sentinel + observer, no scroll listener |
| 3D card tilt | ✅ | `assets/depth.js`, pointer-fine only |
| 3D gallery rotation | ✅ | `view(inline)` |
| Button press depth | ✅ | CSS only |
| Cart badge bump | ✅ | One pulse per add |
| Decorative brand motifs (bee/heart/leaves) | ✅ | **Client approved 30 Aug** |
| Handwriting intro on the hero heading | ✅ | Both lines, linear timing, 0.1s overlap so it reads as one hand |
| Hero at full viewport height | ✅ | `--hero-height: 100svh`, header overlaps rather than stacking |
| Transparent header over hero + materials | ✅ | Fades to solid once the last `[data-header-overlay]` section passes |
| Materials: 3 full-height panels, pinned | ✅ | Alternating image left/right, text top/bottom |
| Product row as a true one-row carousel | ✅ | Was a wrapping 4-up grid at ≥1024px |
| Editable alt text on every image section | ✅ | hero, image-with-text, materials blocks |
| Dead-setting detection in the theme check | ✅ | Follows `{% render %}` one level so block-passing isn't a false positive |
| Full-section scroll snapping | ❌ | **Tried and reverted** — see below |
| Image zoom on product gallery | ⬜ | Brief lists it; not built |
| Testimonials slider animation | ⬜ | Section not built |
| Smooth scroll (Lenis) | ⛔ | Conflicts with the brief — §7.6 |
| Intro splash / page loader | ⛔ | §7.5 |

### Bugs found on the live store

These only surfaced once the theme was on Shopify — the local harness had
masked both.

| Bug | Effect | Fix |
|---|---|---|
| `templates/index.json` set an `eyebrow` setting the materials schema no longer declared | Shopify **rejects a JSON template that sets an undeclared setting**, so there was no index template at all: every route worked and `/` returned 404 | Stale key removed; `check-theme.mjs` now validates every JSON template against its section schemas |
| **`featured-collection`'s schema** — the `eyebrow` and `ghost_word` settings I had added | Shopify **silently dropped the whole section**, which 404'd the homepage. Found by mounting each suspect section in a *different* working template in one commit (`materials`→`/search`, `all_products`→`/cart`, `instagram`→`/404`): two rendered, one did not, naming the culprit in a single sync cycle | Schema simplified toward Dawn's shape (`heading`, `collection`, `products_to_show`). **Not yet pinned to which of the two settings** — both were removed together. Re-add one at a time and verify |
| **A Liquid `{% comment %}` tag written literally inside a comment body in `materials.liquid`** | Shopify tracks *nested* comment tags, so the inner one opened a block that never closed. The section failed to parse and Shopify **silently dropped it** — no error anywhere. With it in the template the homepage returned 404; every other route worked. **LiquidJS tolerates this, so the harness rendered fine and it only appeared on the store.** This was the root cause of the homepage 404 | Rewritten as prose; `check-theme.mjs` now rejects any Liquid tag inside a comment body |
| Three `main-product` block names over 25 characters | Shopify silently drops a block whose name exceeds the limit — the customization fields would have vanished from the product page | Shortened; schema-limit checks added |
| `index.json` used a hyphenated section id (`all-products`) and raw-path url settings | Compared against Dawn: section **ids** are lowercase + underscores (hyphens belong in the section *type*), and url settings use `shopify://collections/all`, not `/collections/all`. Suspected cause of the homepage 404 | Renamed to `all_products`, urls switched to `shopify://`, links to nonexistent resources cleared; `check-theme.mjs` enforces both |
| Missing `templates/password.liquid` | The store is password-protected and the theme had no password template | Added, standalone via `{% layout none %}` |
| `overlay_opacity` default of 72 on a 40–90 range with step 5 | Shopify **rejects a section schema whose range default is not `min + n × step`**, and a rejected schema takes every template referencing it down — the homepage 404'd while every other route worked | Changed to 75 (still above the contrast floor); `check-theme.mjs` now validates every range default and template value |
| `font_face` emitted outside a `<style>` block | The filter returns raw CSS text, so the browser treated it as stray text in `<head>`, moved it into `<body>`, and the whole `@font-face` declaration rendered as visible text at the top of every page | Moved inside `<style>`; the harness shim now returns raw CSS like Shopify does, and `npm run render` fails if any `@font-face` lands outside a `<style>` |

### Bugs found and fixed in this area

| Bug | Effect | Fix |
|---|---|---|
| `setupResponsiveAccordions` deleted by an earlier edit | `ReferenceError` aborted `init()`, killing **all** reveals, cart bump, back-to-top and footer accordions | Restored; `init()` now isolates each step so one failure cannot cascade |
| `overflow: hidden` on parallax containers | Creates a scroll container, so `view()` bound to a box that never scrolls — every parallax frozen at exactly 50% | `overflow: clip` (clips without a scroll container) |
| Reveals fired once and never replayed | Scrolling back up and down showed nothing | Reveals now driven by scroll position, so they reverse |
| Motion policy evaluated once at load | Rotating portrait→landscape stayed simplified all session | Re-evaluates on media-query change and orientation |
| Single motion brake | A phone got **no** animation at all | Split into `reduce-motion` (hard) and `simplify-motion` (soft) |
| Reveals armed while tab hidden | Content could be hidden with no observer to reveal it | Defers arming until the page is visible |
| "Subtle" intensity too small to perceive | Read as broken | Distances and durations raised |
| `img[width][height] { height: auto }` in base.css | Specificity (0,2,1) silently beat **every** component image-height rule — hero, cards, Instagram tiles and material panels all fell back to natural ratio instead of filling their box | Wrapped in `:where()` so it contributes zero specificity |
| Hero recede via a named timeline on `.materials` | `view-timeline-name` is a single property, so it **overwrote** `--materials-pin` and killed all three panel animations; it also left the hero stuck dimmed whenever the timeline was inactive | Recede removed; the layered edge carries the effect with nothing to break |
| `{%- comment -%}` placed *inside* a `<section>` tag | Whitespace stripping fused two attributes into `data-materialsdata-header-overlay` | Comment moved above the tag |
| Empty inline `<span>` used as an IntersectionObserver sentinel | A 0×0 rect never reports as intersecting, so the header was permanently "stuck" | Given a 1px box with a cancelling negative margin |
| Materials pin read `view-timeline-name` at `DOMContentLoaded` | Section stylesheets are `<link>`s in `<body>` and may not have applied yet, so the pin never engaged | Re-checked on `load` |
| Panels hidden off-screen with no confirmation the timeline resolved | An unresolved timeline held every panel at its start keyframe — a blank section | Gated behind `.materials-ready`, added only after the timeline is confirmed |
| Material panels sized `100svh - header` and pinned below the header | Left a strip of page background above each panel, so the transparent header read as a separate grey bar instead of merging into the panel | Panels run the full `100svh` under the floating header; copy padded clear of it |
| `materials` declared an `eyebrow` setting that nothing rendered | A theme-editor control that silently did nothing | Removed; `check-theme.mjs` now fails on any unrendered setting |

---

## 6. Documentation and tooling

| Item | Status |
|---|---|
| `README.md` — install, dev, commands | ✅ |
| `docs/PROJECT-BRIEF.md` — both briefs + settled decisions | ✅ |
| `docs/STATUS.md` — this file | ✅ |
| `docs/DESIGN-SYSTEM.md` — palette, measured contrast, type | ✅ |
| `docs/FONTS.md` — loading strategy and licence | ✅ |
| `docs/ANIMATION.md` — motion system and brakes | ✅ |
| `docs/MOBILE-ADAPTATIONS.md` — desktop→mobile differences | ✅ |
| `MOBILE-VALIDATION.md` — validation results and limits | ✅ |
| `scripts/check-theme.mjs` — integrity check | ✅ |
| `scripts/package-theme.mjs` — ZIP builder | ✅ |
| `dev/` — LiquidJS render harness + viewport probe + audit | ✅ |
| Theme editor setup guide | ⬜ |
| Metafield / metaobject setup guide | ⛔ §7.3 |
| Instagram app install guide | ⛔ §7.2 |

---

## 6b. Debugging Shopify-only failures

Shopify **silently drops** a section it will not accept — no error in the
storefront, no error in the page source. The section simply is not there, and
if it was the only thing standing between the router and a valid template, the
page 404s. Every other route keeps working, which makes it look like a routing
problem.

The local LiquidJS harness does not reproduce this class of bug: LiquidJS
accepts things Shopify rejects. Assume the harness passing means nothing about
Shopify-side validity.

**The technique that works:** mount each suspect section in a *different*
template that already renders (`/search`, `/cart`, `/404`), all in one commit.
One sync cycle then tests every suspect independently and names the culprit.
Bisecting `index.json` one section at a time costs a sync cycle per suspect and
takes the homepage down while you do it — avoid it.

Sync timing is per-file and uneven. A brand-new section file can lag behind the
template that references it, so a section missing right after a push may just
be timing. Re-check before concluding.

## 7. Open decisions blocking work

| # | Decision needed | Blocks |
|---|---|---|
| 1 | Shopify plan | Checkout branding / Checkout Extensibility advice |
| 2 | Which Instagram app; free vs paid; shoppable posts; post count; reels; captions | Instagram gallery page, app install guide |
| 3 | Priced customization examples, expected variant counts, whether extra cart lines are acceptable, app budget | Price + inventory customization, metafield model |
| 4 | Which templates are needed for release one | Blog, article, contact, gift card, customer accounts |
| 5 | Page loader: when it appears, what animation, which SVG, max duration | Page loader / intro splash |
| 6 | Approve Lenis, overriding the brief's own no-scroll-jacking rule? | Smooth scroll |
| 7 | Per-section colour schemes needed, or are global colours enough? | Colour scheme system |

---

## 8. Conventions any agent must follow

- **Mobile-first.** Every media query is `min-width`. Never write a rule a
  smaller breakpoint has to undo.
- **44px minimum** for anything interactive. Use `--tap-min`.
- **Never emit a bare `<img>`.** Use `snippets/responsive-image.liquid`, or
  `art-directed-image.liquid` when the mobile crop should differ.
- **Never let a brand colour carry text without checking contrast.** Four of
  the six fail on cream.
- **Progressive enhancement.** Every component works before its JS runs.
  Animated elements are authored *visible*.
- **`overflow: clip`, not `hidden`,** on anything wrapping a scroll-driven
  animation — `hidden` creates a scroll container and freezes `view()`.
- **Isolate init steps.** One failing component must never abort the rest.
- **No build step.** Shopify's GitHub integration cannot run one.
- **No `startswith` / `endswith`** — not Shopify Liquid. Use `| slice: 0`.
- **`color-mix()` computes to `color(srgb 0-1)`,** not `rgb()` — naive parsers
  misread it.
- Run `node scripts/check-theme.mjs` before committing.
- Re-run `npm run render` and `dev/audit.js` after layout changes.
- **Update this file in the same commit as the work.**

---

## 9. Commands

```bash
npm install
npm run render                  # real theme Liquid -> dev/dist/
npm run serve                   # http://localhost:4321
node scripts/check-theme.mjs    # integrity check
npm run package                 # bloom-arts-theme.zip
```

Viewport harness: `http://localhost:4321/viewport.html?src=product.html&w=320`
Audit: paste `dev/audit.js` into the console, call `bloomAudit()`.
