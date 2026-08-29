# Bloom Arts — Shopify theme

A mobile-first Shopify **Online Store 2.0** theme, built from scratch for
Bloom Arts. No framework, no bundler, no build step — what is committed is
what runs.

> *Little Creations, Big Smiles*

## Installing

### Option A — upload a ZIP

```bash
npm run package     # -> bloom-arts-theme.zip
```

Then: Shopify admin → **Online Store → Themes → Add theme → Upload zip file**.

The archive contains the theme folders at its root (Shopify rejects a nested
parent directory) and excludes the dev harness, scripts and docs.

### Option B — connect this repo to Shopify

Shopify admin → **Online Store → Themes → Add theme → Connect from GitHub**,
then pick this repository and branch.

The theme folders sit at the repository root, which is what the GitHub
integration requires. Because there is no build step, every push is
immediately valid — nothing needs compiling first.

## After installing

1. **Theme settings → Brand** — upload the logo, mobile logo and favicon.
   The identity sheet ships `.svg`; use the SVG or a transparent PNG.
2. **Theme settings → Typography** — Lora and Poppins are preselected. For the
   Great Vibes script accent, add `assets/great-vibes-regular.woff2`
   (see `docs/FONTS.md`) or switch the accent off.
3. **Theme settings → Colours** — the six brand hexes are already the
   defaults. Read `docs/DESIGN-SYSTEM.md` before changing any of them: four of
   the six fail contrast as text and the role assignments exist to prevent
   that.
4. **Theme settings → Animation** — intensity, speed and reveal style.
5. Add a **product template** with the customization blocks you need — colour
   swatches, short text, long text, dropdown, file upload. Each posts as a
   line item property and appears in the cart and on the order.

## Requirements

Only for local development. The theme itself has no runtime dependencies.

- Node 18+ (developed on 22)
- `zip` (ships with macOS and most Linux distributions) for packaging

## Local development

There is no Shopify store wired up, so the theme renders through a local
harness instead.

```bash
npm install
npm run render     # render the real Liquid to dev/dist/
npm run serve      # http://localhost:4321
npm run dev        # both
```

Test a specific viewport width — this uses an iframe, so media queries,
`vw`/`svh` units and container sizing all resolve against a genuine narrow
viewport, which window resizing cannot reach below about 400px on macOS:

```
http://localhost:4321/viewport.html?src=product.html&w=320&h=780
```

Run the audit from the browser console on any page — see `dev/audit.js`:

```js
bloomAudit()   // overflow, touch targets, images, clipped text, contrast
```

### What the harness is and is not

`dev/render.mjs` renders the **real theme Liquid** with LiquidJS plus shims for
the Shopify-specific surface the theme uses (`image_url`, `money`, `t`,
`asset_url`, and the `section` / `schema` / `form` / `paginate` tags), against
mock product data in `dev/data/`.

It is **not** a Shopify emulator. It is good enough to validate layout, touch
targets, reflow, contrast and reserved space at real viewport widths. It cannot
verify cart behaviour, checkout, app blocks, or Shopify's own rendering. Those
need a real store — see `MOBILE-VALIDATION.md`, which says exactly which claims
are harness-verified and which are not.

Nothing under `dev/`, `scripts/` or `docs/` ships to Shopify.

## Checks

```bash
node scripts/check-theme.mjs
```

Catches missing assets, `{% render %}` of a nonexistent snippet, sections
referenced by a template that do not exist, invalid schema JSON, unbalanced
CSS braces, non-Shopify Liquid operators, and homoglyphs inside CSS
declarations.

## Layout

```
assets/      CSS and JS — one stylesheet per component, loaded by the section
config/      settings_schema.json (the single source of truth for branding)
layout/      theme.liquid
locales/     en.default.json
sections/    Online Store 2.0 sections
snippets/    Reusable partials
templates/   JSON templates
docs/        Design system, fonts, animation, mobile adaptations
dev/         Local render harness — never shipped
scripts/     Packaging and integrity checks
```

## Documentation

**Start here if you are picking this up cold:**

- [`docs/PROJECT-BRIEF.md`](docs/PROJECT-BRIEF.md) — both client briefs, brand facts, and every decision already made
- [`docs/STATUS.md`](docs/STATUS.md) — what is built, what is not, and what is blocked on a client decision

Reference:

- [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) — palette, measured contrast, type scale
- [`docs/FONTS.md`](docs/FONTS.md) — how each family loads and why
- [`docs/ANIMATION.md`](docs/ANIMATION.md) — motion system and its brakes
- [`docs/MOBILE-ADAPTATIONS.md`](docs/MOBILE-ADAPTATIONS.md) — every desktop feature with a different mobile interaction
- [`MOBILE-VALIDATION.md`](MOBILE-VALIDATION.md) — validation results and their limits
