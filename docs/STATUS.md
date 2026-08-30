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

Customization options are **configured in the Shopify admin, per product** —
see `docs/CUSTOMIZATION-FIELDS.md` for the two definitions to create. The theme
ships none of its own: a product with nothing configured renders no fields and
no heading.

The product template carries a **Customization** block that holds no field
definitions at all — it is only a position, so the theme editor decides where
the panel sits and the admin decides what is in it. The per-field block types
still exist for a catalogue that genuinely shares one set of options, but
nothing ships using them and a product's own list wins outright.

This coupling was a real bug for one commit: the admin-driven fields rendered
from *inside* the loop over the theme-editor customization blocks, so removing
those blocks — the obvious thing to do once the admin path existed — would have
silently taken the admin fields with them.

Nothing about an option lives in the theme any more: not the label, not the
values, not the swatch colours. A swatch value carries its own colour as
`Terracotta:#b45f3f`, and variant swatches read Shopify's native
`value.swatch.color` / `value.swatch.image`. The named palette in
`component-swatches.css` is a fallback for the brand's own shades, not the
mechanism — which is why an option value like "Navy" with no admin swatch
rendered as a beige circle.

`snippets/customization-field.liquid` no longer reads `block.settings`. It
takes a flat set of parameters, and the two callers — the theme-editor block
and `snippets/product-customization-entry.liquid` for the admin metaobject —
each flatten their own source onto it. The harness renders
`product-metafields.html` off a mocked metaobject so the admin path is
exercised on every build rather than shipping unrendered.

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

**Inlined SVG artwork.** An SVG referenced by `<img>` is a sealed document:
stylesheets and scripts in the page cannot address a shape inside it, and
scripts inside it never run. Animating its parts is not a matter of better
CSS — the markup has to be in this document. So `[data-inline-svg] img` is
fetched and the `<img>` replaced by the SVG itself.

**Same-origin only, and sanitised on the way in.** Inlining is injecting
third-party markup: an SVG can legally carry `<script>`, event handlers and
external references, none of which could ever execute while it was an `<img>`.
`sanitiseSvg()` strips `script`, `foreignObject`, `iframe`, `embed`, `object`,
SMIL `animate`/`set`, every `on*` attribute, any `href` that is not a local
fragment, and any `javascript:` value. That guarantee should not be quietly
traded away for an animation.

**The studio artwork is now hand-authored vector**, in
`snippets/studio-artwork.liquid`, selected by the section's **Artwork**
setting. Every `.svg` the merchant had — including the one named
`bee-vector-svg.svg` — was a PNG in an `<svg>` wrapper: zero paths, circles or
polygons, and one of them 2.4 MB. A bitmap has no parts, so nothing inside it
can be animated, recoloured or scaled.

Not one hex value lives in the SVG markup; every fill and stroke resolves to a
brand token in `component-studio-art.css`, so changing the palette repaints the
drawing. Stroked paths carry `pathLength="100"`, which makes the draw-on exact
and resolution-independent — dashoffset 100 is undrawn, 0 is finished,
whatever the curve actually measures.

Sequence: the bee flies in with the brush it is holding, paints the coral half
of the heart, then the amber half, then the sprig grows where the brush
finished. Wings beat out of phase with each other and the antennae wobble; both
idle loops are dropped under `simplify-motion`, since they are the only things
that never stop.

Two traps, both hit and both worth knowing:

- **`transform-box: fill-box` must be applied to named parts, never with a
  wildcard.** It also reinterprets the origin of any `transform` attribute
  already on the element, so a blanket rule caught the abdomen and every leaf —
  all of which carry `rotate(a cx cy)` — and threw them across the canvas.
  Static rotation goes on a wrapper `<g>`; animated transforms go on the child.
  No element gets both.
- **The editorial scrim has to be switched off for line art.** It exists to put
  a known background behind text over an unknown photo; over transparent
  artwork it just bleaches the drawing. The media is inset instead, which keeps
  the bee out of the copy's column rather than veiling it once it is there.

Top-level `<g>` elements are numbered `data-art-part="1..n"` — no assumption
about ids the merchant's export tool may not have written. For the studio
artwork those are, in document order, the bee with its brush, the heart, and
the leaves, so the CSS has the bee fly in from the lower left, the heart wipe
in along the brush stroke as though just painted, and the leaves grow from
their stem. The bee keeps a slow idle hover afterwards, which `simplify-motion`
removes since it is the one thing here that runs forever.

`transform-box: fill-box` is load-bearing: without it a transform on an SVG
group resolves against the whole viewBox, so a 12% translate moves by 12% of
the canvas and a rotation swings around the canvas corner.

The class is toggled by IntersectionObserver rather than added once, because
the band sweeps out and back as you scroll past and return — a one-shot draw
would play to an empty screen and never again. If the fetch or the parse
fails, the `<img>` is left exactly as it was.

**Editorial image-with-text.** The studio section is full bleed: no gutters,
no block padding, image from the centre to the right edge at `z-index: 0`,
text over it at `z-index: 1`. Contrast does not depend on which photo the
merchant picks — the image carries a scrim that is fully the page colour at
its inner edge and gone before the photograph is doing any work, so the
overlap band always has a known background behind it. Below 768px the overlap
becomes a solid panel lapping the bottom of the image instead, so body copy is
never on an unknown photograph on a phone.

The two halves cross the section in opposite directions as one scroll-linked
movement: the image arrives from its own side, both hold across the middle 40%
of the section's travel, and they leave the way the other came in. Scrolling
back up plays it backwards for free — the reason it is `animation-timeline:
view()` and not an IntersectionObserver, which has no notion of a halfway
point and would need the reversal written by hand. Directions are custom
properties, so the theme editor's image-position setting flips the animation
with the layout.

The band is a full `100svh` and the image leads: sampled off the keyframes at
1000px width, the image settles at 34% progress while the text is still at
-180px, the text settles at 52%, and on the way out the image starts leaving
at 60% with the text following at 72%. The stagger is a **hold at the start of
the text's keyframes**, not a delay — a scroll-linked animation has no delay to
give, since its progress is scroll position rather than elapsed time.

**The band is pinned.** The section is a 190svh runway with a `position:
sticky` inner, so it holds still while its own contents leave and the next
section then climbs over the emptied band. Nothing is scroll-jacked — the
wheel behaves normally — but because the band is pinned, the movement the
shopper reads is the next section arriving rather than this one departing.

The next section needs `position: relative; z-index: 1`, applied via
`.shopify-section:has(> .image-text--editorial) + .shopify-section`. A sticky
element is positioned and would otherwise paint above the in-flow section
after it, so the next section would climb up *behind* the pinned one.

Pinning also forces the timeline to change. Once the band is pinned its
contents stop moving relative to the viewport, so an anonymous `view()`
timeline on them stalls exactly when the sweep is meant to be happening. The
named `--editorial-pin` timeline belongs to the runway, which is still
scrolling. Mapped onto the runway, `cover` progress 34%-66% is the pinned
phase; the image settles at 30% and is gone by 64%, the text settles at 42%
and is gone by 68%.

Pinning is gated behind `.editorial-ready`, added by `global.js` only after it
confirms the named timeline resolved — the same gate as the materials pin and
for the same reason. The sweep's first keyframe is fully off-screen at zero
opacity, so an ungated pin plus an unresolved timeline would be a
two-viewport band of invisible content.

The section also drops `parallax-media`: a drift keyed to the image's own
`view()` timeline freezes mid-drift once the band is pinned.

**The section must not carry `defer-render`.** `content-visibility: auto`
guesses the height from `contain-intrinsic-size` (600px), which sized the
full-height band at 600px while its own contents were 861px, and it left the
`view()` timeline inactive so the sweep never ran.

**Measuring scroll-driven animation through browser automation does not
work.** A backgrounded tab suspends `requestAnimationFrame` and scroll
timelines, so every `ViewTimeline.currentTime` on the page reads `null` —
including ones that are known good. Sample the `@keyframes` instead, by
applying them to a throwaway element with `animation-play-state: paused` and a
negative `animation-delay`: that runs on the document timeline and gives exact
values per progress point without needing the page to be live.

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
| **`featured-collection`'s schema** — the `eyebrow` and `ghost_word` settings I had added | Shopify **silently dropped the whole section**, which 404'd the homepage. Found by mounting each suspect section in a *different* working template in one commit (`materials`→`/search`, `all_products`→`/cart`, `instagram`→`/404`): two rendered, one did not, naming the culprit in a single sync cycle | Schema simplified toward Dawn's shape (`heading`, `collection`, `products_to_show`). **Now pinned:** `eyebrow` was re-added alone and the section still renders on the live store, so **`ghost_word` was the setting Shopify rejected**. Why it was rejected is still unknown |
| **A Liquid `{% comment %}` tag written literally inside a comment body in `materials.liquid`** | Shopify tracks *nested* comment tags, so the inner one opened a block that never closed. The section failed to parse and Shopify **silently dropped it** — no error anywhere. With it in the template the homepage returned 404; every other route worked. **LiquidJS tolerates this, so the harness rendered fine and it only appeared on the store.** This was the root cause of the homepage 404 | Rewritten as prose; `check-theme.mjs` now rejects any Liquid tag inside a comment body |
| Three `main-product` block names over 25 characters | Shopify silently drops a block whose name exceeds the limit — the customization fields would have vanished from the product page | Shortened; schema-limit checks added |
| `index.json` used a hyphenated section id (`all-products`) and raw-path url settings | Compared against Dawn: section **ids** are lowercase + underscores (hyphens belong in the section *type*), and url settings use `shopify://collections/all`, not `/collections/all`. Suspected cause of the homepage 404 | Renamed to `all_products`, urls switched to `shopify://`, links to nonexistent resources cleared; `check-theme.mjs` enforces both |
| Missing `templates/password.liquid` | The store is password-protected and the theme had no password template | Added, standalone via `{% layout none %}` |
| `overlay_opacity` default of 72 on a 40–90 range with step 5 | Shopify **rejects a section schema whose range default is not `min + n × step`**, and a rejected schema takes every template referencing it down — the homepage 404'd while every other route worked | Changed to 75 (still above the contrast floor); `check-theme.mjs` now validates every range default and template value |
| `font_face` emitted outside a `<style>` block | The filter returns raw CSS text, so the browser treated it as stray text in `<head>`, moved it into `<body>`, and the whole `@font-face` declaration rendered as visible text at the top of every page | Moved inside `<style>`; the harness shim now returns raw CSS like Shopify does, and `npm run render` fails if any `@font-face` lands outside a `<style>` |
| `position: sticky` on the header and the pinned hero | Shopify wraps every section in a `.shopify-section` div. A sticky element can only travel inside its own parent, and that wrapper is exactly as tall as the header — so the header scrolled away with it. The sibling selector `.header--transparent ~ main` stopped matching for the same reason, and the scroll sentinel sat *inside* the sticky wrapper so it could never leave the viewport | Sticky moved onto the wrapper via `.shopify-section:has(> .header--sticky)`; sibling rule rewritten as `body:has(.header--transparent) main`; sentinel moved into `layout/theme.liquid`. **The harness now emits `.shopify-section` wrappers**, since this was the third Shopify-only bug it had hidden |
| Every `image_picker` setting in the theme is empty | The harness fills empty pickers with generated placeholders so layout can be measured, so locally the store looked finished. On Shopify the same settings render the grey placeholder SVG — the Instagram grid was six grey squares, and the logo, hero, studio image and all three material panels were unset too | The empty Instagram grid no longer renders on the storefront (it still renders in the theme editor, or a merchant could never add the first image). `npm run render` now **lists every setting it filled**, and `BLOOM_BARE=1 npm run render` renders what a freshly installed theme actually serves |
| `templates/product.json` used `"order"` for its block order instead of `"block_order"` | `"order"` is the top-level key for *section* order; inside a section the key is `"block_order"`. Shopify rendered **none of the 13 blocks** — the product page had an image and an empty info column, no title, no price, no add to cart. Every other page was fine, so it did not look like a template problem | Key corrected. `check-theme.mjs` now fails on a section that has blocks but no `block_order`, names `"order"` explicitly as the likely confusion, and also catches blocks missing from `block_order` or listed there but not defined |

### Instagram embeds

The grid renders live Instagram embeds. A `post` block takes an **Instagram
link** — the reel or post permalink, editable per block in the theme editor —
and the theme turns it into an `https://www.instagram.com/reel/<code>/embed/`
iframe. That is the same endpoint Instagram's own `embed.js` produces, so the
merchant pastes only the URL rather than a wall of blockquote markup, and no
third-party script runs on the storefront.

Priority per tile: **permalink → Shopify-hosted video → image**.

**Instagram's chrome is cropped away**, at the merchant's request — no profile
bar, no "View more on Instagram", no like and comment row. A cross-origin
iframe cannot be styled from outside, so the tile is a window: the iframe is
oversized, offset up and left, and everything but the reel falls outside the
clip.

The geometry is measured from a live embed at five different widths, not
assumed. Constant across all of them:

| Quantity | Value |
|---|---|
| Chrome above the media | 54px, fixed |
| Media box | 1:1.25 of the iframe width |
| Chrome below | ~154px at a single-line caption |
| 9:16 reel inside the media box | letterboxed to 0.703 x the media width |

Inverting the last row: a reel fills a tile of width W when the iframe is
`W / 0.703 = 1.4222W` wide and offset left by `0.2111W`, which is what the CSS
does in `cqw` units. Tiles are 9:16; grid is 1 / 2 / 3 columns. (A 15px
discrepancy in the first measurement was the frame's own scrollbar gutter —
`scrolling="no"` removes it, so it is not in the formula.)

The **Embed crop** section setting switches to the whole 4:5 frame for a post
that is not a 9:16 reel, which would otherwise have its sides cropped. All six
current reels are 1512x2688, so the default is correct for them.

**They are slow and they are flaky.** Measured on the live store, each embed
document takes about 8.4 seconds to arrive, and the app inside it needs longer
still. Six of them is a real cost. Two mitigations are in: a `preconnect` to
`www.instagram.com`, and JS that promotes the frames from `lazy` to `eager`
once the section is about two screens away, so they have loaded by the time
they are scrolled to. Frames stay lazy in the markup, which is the no-JS
behaviour.

Instagram also **rate-limits**. After roughly 25 embed loads from one IP in a
few minutes they start returning blank frames — verified by injecting a plain,
uncropped, fully visible control iframe alongside the cropped ones and finding
that it went blank too, having rendered fine minutes earlier. Do not read a
blank grid during development as a theme bug without running that control.

They also render blank when framed from `localhost` — the script loads and
runs but paints nothing. Reproduced on a bare test page with no theme CSS, so
it is an embedding-origin check on their side. Local previews of this section
will look empty; only the real domain tells you anything.

If Instagram ever refuses outright, the Shopify-hosted video path is already
built and needs only a file per block.

Embedding also loads Meta content into the storefront and sets their cookies
for every visitor, which is a consent question wherever that matters.

### Bugs found and fixed in this area

| Bug | Effect | Fix |
|---|---|---|
| The SVG sanitiser stripped every `href` that was not a local fragment | The studio artwork is not vector art — it is six base64 PNGs in `<image xlink:href="data:image/png;base64,...">`, which is what export tools commonly emit. Stripping those threw the whole drawing away and left an empty frame. Shipped, and only caught when the source file was inspected directly | `isSafeSvgRef()` allows local fragments and base64 **raster** data URIs, which cannot execute anything. `data:image/svg+xml` stays blocked — a nested SVG can carry script and would arrive after the sanitiser had run. Rule unit-tested against fragment, png, jpeg, nested svg, `javascript:`, cross-origin and same-origin-path inputs |
| Hero copy moved from bottom-aligned to centred | The scrim's strongest stop was at the bottom *because that is where the text was*. Moving the copy without moving the band would have left the heading on the weak middle of the gradient at roughly 0.55 strength — under the documented contrast floor over a light photograph | Full scrim strength now spans 20%-80%, which is the centred copy's band (~29%-71%) plus margin, and no wider. Outside it the scrim still eases off so the photograph does not become a flat wash |
| Every horizontal scroller set `overflow-x: auto` and left `overflow-y` unset | An unset `overflow-y` next to a scrollable axis computes to **`auto`, not `visible`** — so the product carousel, the product gallery and the materials row were all vertical scroll containers. The scroll-reveal keyframes translate content down by up to 14px while they run, which gave the container real scrollable overflow and a scrollbar that swallowed the page's wheel — so it only misbehaved *while scrolling*, which is what made it look like an image-size problem | `overflow-y: hidden` on all three (`clip` is not a legal pairing with a scrollable axis and computes to `hidden` regardless). It costs nothing, since `overflow-x: auto` had already made each one a scroll container. The carousel also gains `padding-block` with a cancelling negative margin, so the hover lift and focus rings are not clipped |
| The product gallery passed `ratio: 1.25` to `responsive-image` | That crops on the **CDN**, so the parts of the photograph outside a 4:5 box never reached the browser at all — no CSS could recover them. The image on a product page was silently cropped | Ratio dropped, `object-fit: contain`, and the frame takes the page background so the fitted space reads as page rather than as bars |
| The product info column was sticky with `max-height` + `overflow-y: auto` | A second scrollbar inside the page. The cap was there because a sticky element taller than the viewport pins and its lower half becomes unreachable, but a nested scroller steals the wheel and hides the buy button behind a scroll nobody expects | The **gallery** sticks instead — bounded height, so it needs no cap — and the info column flows |
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

The harness has now hidden five Shopify-only failures (nested comment tag,
`font_face` outside `<style>`, the missing `.shopify-section` wrappers, empty
`image_picker` settings, and `"order"` accepted in place of `"block_order"`).
The pattern every time was the harness being *more forgiving* than Shopify.
When a divergence turns up, fix the harness to match Shopify rather than only
fixing the theme — leniency here means not finding out.

**Before every push, run `BLOOM_BARE=1 npm run render`.** It disables the
harness's placeholder-image fill and shows what the store serves with nothing
configured. The normal build fills empty `image_picker` settings so layout can
be measured, which is useful and also the reason an entirely unconfigured
Instagram grid looked finished locally.

Sync timing is per-file and uneven. A brand-new section file can lag behind the
template that references it, so a section missing right after a push may just
be timing. Re-check before concluding.

## 6c. Customer accounts

All seven classic customer templates now exist — `login`, `register`,
`account`, `order`, `addresses`, `reset_password`, `activate_account` — plus
`snippets/form-errors.liquid`, `snippets/address-fields.liquid`,
`assets/component-customer.css` and `assets/customer-addresses.js`.

**No customer data lives in the theme.** Every form is a Shopify `{%- raw -%}{% form %}{%- endraw -%}` tag
posting to Shopify, which owns the customer record, hashes the password,
issues the session and stores addresses and order history. The theme renders
fields and reads back `form.errors`. There is nothing to store here and
nowhere to store it.

**Why they were built:** Shopify's *new* customer accounts route login through
`shop.app/accounts/bounce`, and that host is blocked on the merchant's network
— their resolver returns a Reliance Jio address (`49.44.79.236`) where
1.1.1.1 and 8.8.8.8 both return Shopify's (`23.227.39.20`), and the connection
fails even when DNS is bypassed. Classic accounts render sign-in inside the
theme on the store's own domain and never touch `shop.app`.

**Switching costs something.** Customers created under new accounts have no
password, because that flow never asked for one. After switching they must use
*Forgot your password* once to set one. Worth an email before flipping the
setting rather than after.

`customer-addresses.js` is progressive enhancement throughout: without it the
edit forms sit open under each address instead of behind a toggle, and the
province select is unfiltered rather than uneditable.

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
