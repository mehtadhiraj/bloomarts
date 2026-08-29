# Bloom Arts — design system

## Palette

The six brand colours from the identity sheet are authoritative and are stored
verbatim in `config/settings_schema.json`.

| Name | Hex | Token |
|---|---|---|
| Dark brown | `#2E241B` | `--brand-brown` |
| Amber yellow | `#F6B028` | `--brand-amber` |
| Coral | `#E66D5B` | `--brand-coral` |
| Olive green | `#7A8F5A` | `--brand-olive` |
| Sage green | `#9BAF7E` | `--brand-sage` |
| Cream | `#FBF6EE` | `--brand-cream` |

## Why roles are assigned the way they are

Four of the six brand colours **fail WCAG AA as small text on cream**. That is
not a flaw in the palette — they are fills and accents, not text colours. The
role assignments below exist so that constraint is enforced by the tokens
rather than left to whoever writes the next component.

Measured against cream `#FBF6EE`:

| Colour | Ratio as text on cream | Verdict |
|---|---|---|
| Dark brown | **14.10** | Passes — the body text colour |
| Olive | 3.31 | Fails AA normal; large text only |
| Coral | 2.91 | Fails — fill only |
| Sage | 2.21 | Fails — surface only |
| Amber | 1.75 | Fails — fill only |

Text **on** brand fills:

| Background | Brown text | White text |
|---|---|---|
| Amber `#F6B028` | **8.06** ✅ | 1.88 ❌ |
| Coral `#E66D5B` | **4.84** ✅ | 3.13 ❌ |
| Sage `#9BAF7E` | **6.38** ✅ | 2.38 ❌ |
| Olive `#7A8F5A` | 4.26 ⚠️ | 3.56 ❌ |
| Brown `#2E241B` | — | cream **14.10** ✅ |

**Olive is the one trap.** It fails as text on cream *and* brown-on-olive lands
at 4.26 — just under the 4.5 threshold. So olive is never used as a text
colour and never as a background for small text. It appears as leaf motifs,
rules, and the large script accent only.

### Derived shades

Three tones are darkened from brand colours so they can carry small text:

| Token | Hex | Derived from | Ratio on cream |
|---|---|---|---|
| `--color-text-muted` | `#6C635A` | brown, 30% toward cream | 5.47 |
| `--color-error` | `#B45547` | coral, darkened | 4.51 |
| `--color-success` | `#66774B` | olive, darkened | 4.53 |

### Role map

| Role | Token | Value |
|---|---|---|
| Page background | `--color-background` | cream |
| Card / panel | `--color-surface` | `#FFFDF9` |
| Body text | `--color-text` | brown |
| Secondary text | `--color-text-muted` | `#6C635A` |
| Primary action | `--color-accent` / `--color-accent-contrast` | amber fill, **brown** label |
| Solid / secondary | `--color-contrast-surface` / `-text` | brown fill, cream label |
| Sale badge | `--color-sale` / `--color-sale-text` | coral fill, **brown** label |
| Tinted surface | `--color-tint` | sage |

### The hero scrim

Hero text sits over a merchant-supplied photograph from 768px up. No audit can
verify contrast against an image nobody has seen, so the scrim is sized for the
worst case instead.

Brown at **72%** composited over a pure white photograph yields a background
luminance that leaves cream text at roughly **5.4:1**. The first attempt used
62%, which drops to about 4.4:1 over white and fails. 72% is the default and
the merchant can raise it (`Image overlay`, 40–90%).

The script accent over the scrim uses a pale sage-cream mix, not sage: mid-tone
sage reaches only about 2.6:1 there, under the 3:1 large-text floor.

## Typography

| Role | Family | Weight | Notes |
|---|---|---|---|
| Headings | Lora | 600 | `--font-heading`, via Shopify `font_picker` |
| Body / UI | Poppins | 400 / 500 | `--font-body`, via Shopify `font_picker` |
| Script accent | Great Vibes | 400 | `--font-script`, self-hosted — see `FONTS.md` |

The `.script` class carries `font-size: max(1.35em, 1.75rem)` and olive. That
floor is structural on purpose: olive on cream only clears AA as *large* text,
so the script is prevented from ever rendering small enough to fail.

Type scale is fluid (`clamp()`) and multiplied by the merchant's
`heading_scale` setting, so there is one place to adjust overall heading size.

## Shape and spacing

- `corner_style` — sharp / soft (8px) / rounded (18px), driving `--radius`.
- `button_style` — pill / soft / square, driving `--radius-button`.
- `section_spacing` — a percentage multiplier on `--space-xl` / `--space-2xl`.
- Spacing is a fixed scale (`--space-3xs` … `--space-2xl`); components never
  invent one-off values.

## Motion

See `docs/ANIMATION.md`. Every duration derives from `--motion-scale`, so the
merchant's speed setting cannot fall out of step with an individual component.
