# Fonts

The identity uses three families: **Lora SemiBold** (headings), **Great Vibes
Regular** (the "arts" script), and **Poppins Medium** (body and tagline).

## How each is loaded, and why

| Family | Method | Reason |
|---|---|---|
| Lora | Shopify font library (`font_picker`) | In Shopify's library. Served from Shopify's CDN with `font_display: swap`, no third-party request, no extra DNS lookup, and the merchant can change it in the editor. |
| Poppins | Shopify font library (`font_picker`) | Same. |
| Great Vibes | **Self-hosted** in `assets/` | Not in Shopify's font library, so `font_picker` cannot offer it. |

### Why not Google Fonts for Great Vibes

| Approach | Verdict |
|---|---|
| Shopify library | Not possible — Great Vibes is not published there. |
| **Self-hosted woff2** | **Chosen.** Same origin as the theme, so no extra DNS + TLS handshake on a mobile connection; no third-party request, which matters for GDPR since Google Fonts logs visitor IPs; the file is versioned with the theme. Great Vibes is OFL-licensed, so redistribution inside the theme is permitted. |
| Google Fonts CDN | Adds a cross-origin connection on the critical path and sends visitor IPs to a third party. Rejected. |

## Adding the Great Vibes file

The theme references `assets/great-vibes-regular.woff2`. **That file is not in
the repository** — a binary font was not something I could fetch here, so you
need to add it once:

1. Download Great Vibes from Google Fonts (OFL, free for commercial use).
2. Convert the TTF to WOFF2 (`woff2_compress`, or any web font converter).
3. Name it exactly `great-vibes-regular.woff2`.
4. Drop it in `assets/`, or upload it via Shopify admin → Content → Files and
   adjust the `asset_url` in `layout/theme.liquid`.

**If you skip this, nothing breaks.** The `@font-face` request 404s and the
`--font-script` stack falls back to `Snell Roundhand` / `Apple Chancery` /
`cursive`. The script accent is decorative and never the only place a word
appears, so no meaning is lost — it just will not be Great Vibes.

You can also switch it off entirely: **Theme settings → Typography → Use the
Great Vibes script accent**.

## Layout shift

Font swapping is a common source of CLS. Two things prevent it here:

1. `font_display: swap` keeps text visible during load rather than blocking.
2. A metric-adjusted `bloom-fallback` face sits between the real font and the
   system stack, with `ascent-override`, `descent-override` and
   `line-gap-override` tuned so the line box height does not change when the
   real font arrives.

## Weights

`font_modify` returns nil when a weight is not published for a family. Every
derived variant in `layout/theme.liquid` is guarded with `{% if %}` — an
unguarded nil emits a broken `@font-face` rule.

The heading weight is a theme setting (400–700, default 600 to match Lora
SemiBold) rather than being hardcoded.
