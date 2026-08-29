# Bloom Arts — project brief (source of truth)

Both requirement sets the client supplied, preserved verbatim so any agent
picking this up has the full context without needing the chat history.

- **Brief A** — mobile-first requirements (supplied first)
- **Brief B** — full Shopify theme brief (supplied later, includes brand assets)

Implementation status for every line of both briefs lives in
[`STATUS.md`](STATUS.md). **Read that before starting work.**

---

## Brand facts (from the identity sheet)

- **Name:** Bloom Arts
- **Tagline:** Little Creations, Big Smiles
- **Instagram:** `bloom.artss`
- **Products:** handmade concrete, clay and resin homeware, gifts and
  multipurpose items — many customisable

### Palette (authoritative)

| Name | Hex |
|---|---|
| Dark brown | `#2E241B` |
| Amber yellow | `#F6B028` |
| Coral | `#E66D5B` |
| Olive green | `#7A8F5A` |
| Sage green | `#9BAF7E` |
| Cream | `#FBF6EE` |

### Typography

- "bloom" — **Lora SemiBold**
- "arts" — **Great Vibes Regular** (olive green in the logo)
- Tagline and supporting text — **Poppins Medium**

### Logo

Bee holding a coral brush-stroke heart, olive leaf sprigs, coral hearts.
Available as `.ai .eps .svg .png .jpg`. Favicon variants on cream, olive,
white and coral. **Do not redraw, trace, alter or approximate the logo.**

---

## Brief A — mobile-first requirements

> The website must be fully mobile-friendly and designed using a mobile-first
> approach. Mobile must not be treated as a scaled-down desktop version.
>
> Requirements:
>
> - Provide a polished experience across mobile, tablet, laptop, and desktop screen sizes.
> - Prioritize mobile navigation, product discovery, customization, cart actions, and checkout handoff.
> - Use responsive layouts without horizontal scrolling, overlapping content, clipped text, or broken sections.
> - Provide responsive desktop and mobile images where appropriate.
> - Ensure buttons, links, form controls, menus, filters, and customization inputs have accessible touch-target sizes.
> - Keep important actions such as "Add to cart" easy to reach on mobile. Propose a sticky mobile add-to-cart option and wait for approval.
> - Make product galleries swipe-friendly while retaining accessible controls.
> - Ensure dynamic customization forms, colour swatches, text inputs, dropdowns, file uploads, and validation messages work properly on touch devices.
> - Optimize the mobile menu, search, filters, sorting, cart drawer, accordions, and modals for one-handed use.
> - Ensure animations remain smooth and lightweight on mobile devices.
> - Reduce or simplify resource-intensive animation on smaller or lower-powered devices.
> - Optimize fonts, JavaScript, CSS, and images for slower mobile connections.
> - Prevent unexpected layout shifts while images, fonts, Instagram posts, and app blocks load.
> - Account for mobile browser safe areas, virtual keyboards, orientation changes, and sticky interface elements.
> - Test common viewport widths, including approximately 320px, 375px, 390px, 414px, 768px, 1024px, and larger desktop widths.
> - Test on current iPhone and Android layouts wherever testing tools are available.
> - Maintain accessibility, readability, and sufficient colour contrast at every supported screen size.
> - Do not hide essential information or functionality on mobile merely to simplify the layout.
> - Document any desktop feature that requires an adapted mobile interaction.
>
> Include mobile usability, touch behaviour, performance, responsive images,
> navigation, product customization, cart experience, and animation performance
> in the implementation plan and final validation report.

---

## Brief B — full Shopify theme brief

> Act as a senior Shopify Online Store 2.0 theme architect and developer.
> Build a production-ready Shopify theme for my brand, Bloom Arts, using
> Liquid, JSON templates, HTML, CSS, and JavaScript.

### Working rules

1. Do not assume any requirement, business rule, design choice, Shopify capability, app dependency, or product-customization behaviour.
2. If anything is unclear or missing, list it under "Required Decisions" and ask before implementation.
3. For every missing decision: explain why it is needed, present the options, recommend one with reasoning, and do not apply the recommendation until approved.
4. Clearly separate blocking decisions, non-blocking decisions, and recommended improvements.
5. Do not start writing or modifying code until: reference images and existing files are inspected, blocking questions answered, an implementation plan presented, and the plan approved.
6. If a requirement conflicts with Shopify limitations or best practices, highlight the conflict and propose valid alternatives. Do not silently change the requirement.
7. Use Shopify's latest official development guidelines. If a supplied guideline is outdated, explain what changed and provide the official source.
8. Do not hardcode content that should be editable through Shopify Admin or the theme editor.

### Objective

A complete, responsive, accessible, performant, editable, sleek, modern,
attractive and visually rich theme. Modern, polished, premium and
professionally designed; sleek and clean; rich without looking overcrowded,
heavy or flashy. Refined spacing, strong visual hierarchy, elegant typography,
high-quality imagery, subtle depth, polished interactions, attractive
animations and micro-interactions. Fast and accessible despite the richness.
Premium creative brand, retaining a warm, cheerful, handmade personality.
Built from scratch — not Dawn — unless explicitly approved otherwise.

### Visual direction

Richness through generous intentional spacing, editorial layouts, strong type
hierarchy, high-quality photography, large responsive sections, refined product
cards, tasteful borders/shadows/gradients/decorative details, consistent colour
use, smooth transitions, polished loading/empty/hover/focus/success/error
states, carefully designed desktop and mobile experiences, and consistent
visual rhythm. "Rich" must not mean excessive decoration.

**Questions the brief asks to be answered before finalising design direction:**
reference websites; subtle vs balanced vs expressive animation; premium-minimal
vs playful-artistic vs balanced; whether logo motifs (bee, heart, leaves,
circle) may be reused as interface motifs; rounded vs sharp vs mixed components.

### Animation requirements

Entrance, hero, product cards, galleries, image zoom, buttons, links, nav and
dropdowns, mobile menu, cart drawer, filters/sorting, accordions, modals, form
validation, add-to-cart confirmation, loading states, Instagram gallery,
testimonials/sliders, scroll reveals, decorative elements.

Principles: purposeful; GPU-friendly transform/opacity; no scroll-jacking,
excessive parallax or cursor hijacking; no large animation library without
approval; native CSS and lightweight JS; `IntersectionObserver` for scroll
triggers; no ongoing cost off-screen; smooth on mobile and low-powered devices;
controls usable without JS; all functionality available with animation
disabled; respect `prefers-reduced-motion`; no accessibility-hostile flashing;
no CLS; no significant Core Web Vitals harm.

Global animation settings required: enable/disable, intensity, section reveal
style, speed, product-card hover effect, image-hover behaviour, reduced-motion
fallback — without one setting per minor animation.

### Global configuration

Single source of truth for: primary logo, mobile logo, favicon, page-loader
SVG, brand colours, heading/body typography, default button styles, animation
behaviour, global radius and spacing, social links, Instagram handle. All files
reference these; nothing duplicated or hardcoded. CSS custom properties
generated from theme settings.

### Header and banners

Header editable: logo, logo width, desktop/mobile nav, announcement bar,
background and text colours, sticky behaviour, transparent-over-hero, search,
cart icon, account icon, mobile menu, social links, logo alignment, spacing,
entrance and menu animations.

Hero editable: desktop image, mobile image, alt text, heading, supporting text,
button label and link, text alignment, overlay colour and opacity, section
height, colour scheme, optional secondary button, content entrance animation,
image movement/zoom, decorative brand elements.

Homepage layout must be proposed and approved. Candidate sections: announcement
bar, hero, featured collections, featured products, customisable-products
showcase, Instagram preview, brand story, testimonials, FAQ, newsletter, footer.

### Templates required

Homepage, product, collection, cart page or drawer, standard content page,
Instagram gallery page, search, contact, blog, article, 404, password,
gift-card, customer-account entry points. Ask whether every one is needed for
release one. **No fake checkout — hand off to Shopify's native checkout.** Ask
for the Shopify plan and explain available checkout branding / Checkout
Extensibility options.

### Instagram gallery

Dedicated page for `bloom.artss`. **Decision already made: use a Shopify
Instagram-feed app, not direct Meta API credentials in theme code.** Support the
app via app block or compatible section. No scraping. No tokens or secrets in
Liquid, JS, settings or the repo. Graceful empty state. Responsive, accessible,
on-brand. Editable heading, description, spacing, colour scheme, section width.
Pagination or "Load more" if the app supports it. Refined entrance, hover and
loading animation without slowing the page.

**Questions to ask:** which app; free vs paid; posts link to Instagram or are
shoppable; every historical post or a configurable number; reels/videos;
captions, dates, likes, comments. Explain that available history depends on the
app and Meta API limits.

### Product catalogue

Editable via Shopify Admin: name, description, images and videos, price,
compare-at price, SKU, availability, inventory, variants, dimensions, weight,
available colours, material, care instructions, processing time,
customisable/non-customisable status, customization instructions, and further
fields later. Use native fields where suitable; propose metafield/metaobject
architecture for the rest. Do not store core product data in theme settings.

### Dynamic product customization

Some products customisable, some not; each can require a different set of
inputs: colour, display name, custom text, shape, size, style, reference or
inspiration request, request for a similar-but-different product, extra
instructions, file/reference-image upload, and more later.

Must be configurable per product **without editing Liquid each time**. Field
metadata may include: label, type, required, placeholder, help text, min/max
length, min/max value, choices, default, validation rule, display order,
conditional visibility, price adjustment, inventory effect, and whether the
value appears in cart and order.

**Customization may affect price and inventory. Price changes must not be
implemented only in browser-side JavaScript** — the amount shown on the product
page, cart, checkout and final order must be trustworthy and enforced by
Shopify.

Before designing: ask for real products, fields, pricing rules, dependencies
and inventory rules. Then compare Shopify variants, add-on products, line item
properties, metafields/metaobjects, a product-options app, or a custom app /
backend. Recommend an architecture and wait for approval. Account for variant
and option limits. Do not treat line item properties as price-bearing unless
another Shopify-supported mechanism applies the price. Data must appear in the
product form, cart/drawer, checkout where supported, order details and merchant
fulfilment workflow. Ask whether customers can edit choices from the cart, and
about upload size, type, storage, privacy and retention rules.

### Theme editor

Online Store 2.0 sections and blocks. Merchants can reorder homepage sections,
add/remove sections, edit content, select colour schemes, change spacing and
layout, change images and links, configure featured products and collections,
add app blocks, control mobile/desktop behaviour, and control animation
intensity without editing code. Valid schema, useful defaults, sensible labels,
no setting bloat.

### Design deliverables required before implementation

Proposed use of each brand colour; typography hierarchy; button styles; product
card styles; form styles; animation and interaction system; spacing system;
desktop and mobile layout direction; accessibility contrast review; description
or mockup of the visual direction. Long body text must not use the logo fonts.

### Page loader

Optional, attractive, using the globally configured SVG. Enable/disable; must
not block the storefront if the SVG is missing; maximum display duration or
safe fallback; respects `prefers-reduced-motion`; no significant CWV harm;
accessible and must not trap keyboard or screen-reader users; all pages
reference the same global setting; consistent with the brand; must not appear
on every internal interaction if that harms usability. **Ask when the loader
should appear and what animation is expected.**

### Technical requirements

Standard theme structure (`assets/ config/ layout/ locales/ sections/ snippets/
templates/`) including `layout/theme.liquid`. Valid Liquid and JSON templates.
JavaScript only where it materially improves the experience.

OS 2.0 compatible; responsive mobile-first; semantic HTML; keyboard
accessibility; visible focus states; appropriate ARIA; meaningful alt text;
WCAG 2.2 AA contrast where practical; `prefers-reduced-motion`; lazy loading;
responsive images via Shopify image filters; minimal layout shift; optimised
CSS/JS/animation; no unnecessary third-party libraries; no inline secrets; SEO
metadata; Open Graph; canonical URLs; product structured data; breadcrumbs where
appropriate; proper empty/loading/error/unavailable/sold-out states;
translation-ready via locale files; app block support.

No `node_modules`, temp files, caches, secrets or unrelated assets in the ZIP.

### ZIP requirements

Single ZIP, under 50 MB, theme folders at the ZIP root (no parent directory),
safe asset filenames with no spaces, uploads successfully, passes Shopify Theme
Check or documents justified warnings.

### Workflow

- **Phase 1 Discovery** — inspect references and files, restate requirements as
  a checklist, produce a Required Decisions list, mark blocking questions, ask
  in manageable groups, then stop and wait.
- **Phase 2 Planning** — architecture, file/folder plan, page and template list,
  section and block list, global settings design, design system, animation plan,
  metafield/metaobject model, customization architecture, Instagram approach,
  accessibility plan, performance plan, SEO plan, testing plan, dependencies and
  app costs, Shopify limitations and risks, acceptance criteria, exclusions.
  Then stop and wait for approval.
- **Phase 3 Implementation** — incremental, modular, no duplicated global
  settings, preserve unrelated files, explain departures from the plan, concise
  progress updates.
- **Phase 4 Validation** — Liquid syntax, JSON schemas and templates, Theme
  Check, editor settings, product forms, dynamic customization fields,
  price-affecting customization, cart persistence, native checkout handoff,
  Instagram app block, responsive behaviour, animation smoothness, reduced-motion
  fallbacks, accessibility, keyboard nav, image optimisation, missing-image
  fallbacks, empty and error states, CWV impact, Chrome/Safari/Firefox/Android/
  iPhone layouts where available, ZIP structure and size.

### Final delivery

Upload-ready ZIP; source folder; README with installation instructions; theme
editor setup guide; global logo and loader update instructions; animation
configuration guide; font setup instructions; metafield and metaobject setup
instructions; product-customization configuration guide; Instagram app install
and configuration guide; test results; Theme Check results; known limitations;
remaining decisions and future improvements.

### Decisions the client has already given

| Question | Answer |
|---|---|
| Where does the site live? | Greenfield — build from scratch |
| Hosting | **No separate site.** Shopify only, via ZIP upload or GitHub integration |
| Theme base | Lean custom theme, **not** a Dawn fork |
| Checkout | Shopify native hosted checkout |
| Sticky mobile add-to-cart | **Approved** — reveal on scroll |
| Design ambition | Rich, but capability-gated |
| Colours and fonts | Per the identity sheet above |
| Instagram | Use a Shopify app, never raw Meta credentials |
| Decorative logo motifs (bee, heart, leaves) reused as interface decoration | **Approved 30 Aug** — on by default, toggleable per section |
| Section reveals | Reversible on scroll (replay on the way back down), not one-shot |
| Commit identity | `mehtadhiraj21@gmail.com` |
