# Implementation status

**Read this and [`PROJECT-BRIEF.md`](PROJECT-BRIEF.md) before starting work.**
Together they hold the full context — no chat history needed.

Last updated: 30 August 2026.

Legend: **Done** · **Partial** (works, but scoped short of the brief) ·
**Not started** · **Blocked** (needs a client decision)

---

## 1. Brief A — mobile-first requirements

| Requirement | Status | Where |
|---|---|---|
| Polished across mobile/tablet/laptop/desktop | **Done** | Swept 320–1440px, 0 failures |
| Mobile-first nav, discovery, customization, cart, checkout handoff | **Done** | `sections/`, `snippets/` |
| No horizontal scroll / overlap / clipped text | **Done** | 0 across all pages × widths |
| Responsive desktop + mobile images | **Done** | `snippets/responsive-image.liquid`, `art-directed-image.liquid` |
| Accessible touch targets everywhere | **Done** | 44px floor, 0 violations |
| Sticky mobile add-to-cart (proposed + approved) | **Done** | `snippets/sticky-atc.liquid`, `assets/sticky-atc.js` |
| Swipe-friendly gallery with accessible controls | **Done** | CSS scroll-snap + dots/arrows/keyboard |
| Customization inputs work on touch | **Done** | `snippets/customization-field.liquid` |
| One-handed menu/search/filters/cart/accordions/modals | **Done** | Bottom sheets throughout |
| Smooth, lightweight animation on mobile | **Done** | `assets/animations.css`, `scroll-effects.css` |
| Simplify animation on small / low-powered devices | **Done** | `applyMotionPolicy()` in `global.js` |
| Optimise fonts, JS, CSS, images for slow connections | **Partial** | 14.6 kB JS gzipped; **CSS still 14–16 requests/page** |
| Prevent layout shift (images, fonts, Instagram, app blocks) | **Done** | Reserved boxes, metric-adjusted fallback font |
| Safe areas, virtual keyboard, orientation, sticky elements | **Done** | `env(safe-area-*)`, `interactive-widget`, `dvh/svh` |
| Test 320/375/390/414/768/1024/larger | **Done** | See `MOBILE-VALIDATION.md` |
| Test on real iPhone / Android | **Not started** | No hardware available |
| Contrast + readability at every size | **Done** | 0 failures; `docs/DESIGN-SYSTEM.md` |
| Don't hide essential info on mobile | **Done** | Cart properties shown in full |
| Document adapted mobile interactions | **Done** | `docs/MOBILE-ADAPTATIONS.md` |
| Validation report covering all 8 areas | **Done** | `MOBILE-VALIDATION.md` |

---

## 2. Brief B — templates

| Template | Status | File |
|---|---|---|
| Homepage | **Done** | `templates/index.json` |
| Product | **Done** | `templates/product.json` + `sections/main-product.liquid` |
| Collection | **Done** | `templates/collection.json` |
| Cart page | **Done** | `templates/cart.json` |
| Cart drawer | **Done** | `sections/cart-drawer.liquid` |
| Standard page | **Done** | `templates/page.json` |
| Search | **Done** | `templates/search.json` |
| 404 | **Done** | `templates/404.json` |
| List collections | **Not started** | — |
| Blog | **Not started** | — |
| Article | **Not started** | — |
| Contact page | **Not started** | — |
| Instagram gallery page | **Not started** | Blocked — app not chosen |
| Password | **Not started** | — |
| Gift card | **Not started** | — |
| Customer accounts (login, register, account, order, addresses, reset, activate) | **Not started** | — |

---

## 3. Brief B — systems

| Area | Status | Notes |
|---|---|---|
| OS 2.0 sections + blocks | **Done** | 14 sections, valid schemas |
| Global settings single source of truth | **Done** | `config/settings_schema.json` → CSS custom properties in `layout/theme.liquid` |
| Brand colours as tokens | **Done** | Roles contrast-checked, `docs/DESIGN-SYSTEM.md` |
| Typography (Lora / Great Vibes / Poppins) | **Done** | Great Vibes bundled, `assets/great-vibes-regular.woff2` (29 kB, latin) |
| Logo / mobile logo / favicon / share image pickers | **Done** | Brand settings group |
| Page-loader SVG setting | **Not started** | See "Open decisions" |
| Button styles setting | **Done** | pill / soft / square |
| Animation settings | **Done** | enable, intensity, reveal style, speed, hero motion, card hover, scroll effects, 3D depth, progress bar, back-to-top |
| Global radius + spacing settings | **Done** | `corner_style`, `section_spacing` |
| Social links + Instagram handle | **Done** | Social settings group |
| Colour **schemes** (per-section) | **Not started** | Only global colours exist; brief asks for per-section schemes |
| Header: logo, width, nav, sticky, search, cart, account | **Done** | `sections/header.liquid` |
| Header: transparent-over-hero, bg/text colours, alignment, spacing | **Not started** | — |
| Announcement bar | **Done** | `sections/announcement-bar.liquid` |
| Hero: desktop/mobile image, alt, heading, text, buttons, overlay, height, motifs | **Done** | `sections/hero.liquid` |
| Hero: text alignment, colour scheme | **Not started** | — |
| Featured collection | **Done** | Carousel on mobile, grid on desktop |
| Brand story (image with text) | **Done** | `sections/image-with-text.liquid` |
| Instagram preview section | **Done** (markup) | `sections/instagram-feed.liquid` — reserved tiles + `@app` block support |
| Testimonials | **Not started** | — |
| FAQ | **Not started** | — |
| Newsletter | **Done** | In footer |
| Customisable-products showcase | **Not started** | — |
| SEO metadata, OG, canonical | **Done** | `snippets/meta-tags.liquid` |
| Product structured data (JSON-LD) | **Not started** | — |
| Breadcrumbs | **Not started** | — |
| Translation-ready locales | **Done** | `locales/en.default.json` |
| App block support | **Partial** | `@app` in `instagram-feed` only; not yet in product/collection |
| ZIP under 50 MB, folders at root | **Done** | 0.11 MB, `npm run package` |
| Theme Check | **Partial** | Custom `scripts/check-theme.mjs` passes; official Shopify Theme Check not run (needs Shopify CLI) |

---

## 4. Product customization — the important gap

| Piece | Status |
|---|---|
| Five input types (swatch, text, textarea, select, file) | **Done** |
| Configurable per product without editing Liquid | **Done** — via theme-editor blocks on the product template |
| Label, type, required, placeholder, help text, max length, choices | **Done** |
| Values flow to cart, drawer and order | **Done** — line item properties |
| Client-side validation + error summary | **Done** |
| File upload (multipart, type/size checked) | **Done** |
| Min/max **value**, default value, custom validation rule | **Not started** |
| Display order | **Partial** — block order in the editor |
| Conditional visibility | **Not started** |
| **Price adjustment** | **Blocked** — see below |
| **Inventory effect** | **Blocked** — see below |
| Metafield / metaobject architecture | **Not started** |
| Editing customization from the cart | **Not started** |

### Why price-affecting customization is blocked

Line item properties **cannot carry a price**. Shopify prices the line from
the variant. The brief is explicit that price must not be enforced only in
browser JavaScript, and that is correct — client-side pricing can be edited
before submit.

The three legitimate options, none of which can be chosen without the client:

1. **Variants** — price-bearing options become real variants. Trustworthy and
   native, but capped at 3 options / 100 variants (2,048 on some plans), which
   a wide customization matrix will exceed.
2. **Add-on products** — each paid extra is a separate product added as its own
   line. No variant limit, but the cart shows extra lines.
3. **A product-options app** (or a custom app using Functions / Draft Orders) —
   the only route that handles arbitrary priced options cleanly. Costs money
   and adds a dependency.

**Needed from the client:** real examples of priced options, expected variant
counts, whether extra cart lines are acceptable, and app budget. Until then the
theme handles all **non-price-bearing** customization correctly.

---

## 5. On-scroll effects and 3D

Reference supplied by the client: **momentolegal.com**. Inspected — it uses
Lenis smooth scroll plus `data-reveal` attributes, blur-to-sharp text resolve,
gradient text wipes, oversized ghost display type, and an intro splash loader.

| Effect | Status | Notes |
|---|---|---|
| IntersectionObserver reveal (fade / rise / stagger) | **Done** | `animations.css`, `global.js` |
| Scroll-linked parallax media | **Done** | `animation-timeline: view()` |
| Scroll-linked enter / exit | **Done** | `[data-scroll-enter]`, `[data-scroll-exit]` |
| Blur-to-sharp resolve | **Done** | `[data-scroll-reveal="blur"]` — 768px+ only, blur is not compositor-cheap |
| Gradient text wipe | **Done** | `[data-scroll-reveal="wipe"]` — `background-clip: text` |
| Ghost display word | **Done** | `snippets/ghost-word.liquid` |
| Section heading rule draw | **Done** | `.section-head::after` |
| Scroll progress bar | **Done** | `scroll(root)`, off by default |
| Back-to-top | **Done** | Sentinel + IO, no scroll listener |
| 3D card tilt | **Done** | `assets/depth.js` — pointer-fine only |
| 3D gallery rotation | **Done** | `view(inline)` |
| Button press depth | **Done** | CSS only |
| Smooth scroll (Lenis) | **Blocked** | Conflicts with the brief — see below |
| Intro splash / page loader | **Not started** | Needs client decisions |

### Lenis smooth scroll — flagged conflict

The reference site uses Lenis, which intercepts wheel events and animates
scroll position. That is scroll hijacking, which **Brief B explicitly forbids**
("Avoid scroll-jacking"), and it is a third-party dependency, which the same
brief says needs approval. It also breaks native scrollbar dragging and can
fight `scroll-snap` — which this theme's gallery and carousel rely on.

Not added. If the client wants it, they need to approve overriding their own
constraint. The theme currently uses native `scroll-behavior: smooth`.

---

## 6. Open decisions blocking work

| # | Decision | Blocks |
|---|---|---|
| 1 | Shopify plan | Checkout branding / Checkout Extensibility advice |
| 2 | Which Instagram app; free vs paid; shoppable posts; post count; reels; captions | Instagram gallery page |
| 3 | Priced customization examples, variant counts, app budget | Price-affecting customization, metafield model |
| 4 | Which templates are needed for release one | Blog, article, contact, gift card, customer accounts |
| 5 | Page loader: when it appears, what animation, which SVG | Page loader |
| 6 | Approve Lenis (overriding the no-scroll-jacking rule)? | Smooth scroll |
| 7 | Per-section colour schemes needed, or are global colours enough? | Colour scheme system |
| 8 | Markets, currencies, translations; analytics; cookie consent | Various |
| 9 | Newsletter provider; policies; shipping/returns copy; contact details | Content |

---

## 7. Conventions any agent must follow

- **Mobile-first.** Every media query is `min-width`. Never write a rule that a
  smaller breakpoint has to undo.
- **44px minimum** for anything interactive. `--tap-min`, never hardcoded.
- **Never emit a bare `<img>`.** Use `snippets/responsive-image.liquid`, or
  `art-directed-image.liquid` when the mobile crop should differ.
- **Never let a brand colour carry text without checking contrast.** Four of the
  six fail on cream. See `docs/DESIGN-SYSTEM.md`.
- **Progressive enhancement.** Every component must work before its JS runs.
  Animated elements are authored *visible*; the class that hides them for
  animation is only added once JS confirms motion is allowed.
- **No build step.** Shopify's GitHub integration cannot run one.
- **No `startswith` / `endswith`** — not Shopify Liquid operators. Use
  `| slice: 0`.
- **Watch for `color-mix()`** — Chrome resolves it to `color(srgb 0-1 floats)`,
  not `rgb()`. Naive parsers misread it.
- Run `node scripts/check-theme.mjs` before committing.
- Re-run `npm run render` and the audit in `dev/audit.js` after layout changes.

---

## 8. Commands

```bash
npm install
npm run render                 # real theme Liquid -> dev/dist/
npm run serve                  # http://localhost:4321
node scripts/check-theme.mjs    # integrity check
npm run package                # bloom-arts-theme.zip
```

Viewport harness: `http://localhost:4321/viewport.html?src=product.html&w=320`
Audit: paste `dev/audit.js` into the console, call `bloomAudit()`.
