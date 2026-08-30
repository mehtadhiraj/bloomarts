# Per-product customization fields

Customization options are configured **in the Shopify admin, per product** —
not in the theme. A concrete planter and an engraved keepsake do not take the
same options, so a list defined once in the theme editor is wrong for every
product but one.

Nothing here requires a developer. Once the two definitions below exist, adding
an option to a product is admin work.

---

## 1. Create the metaobject definition

**Settings → Custom data → Metaobjects → Add definition**

Name it `Customization field`. Shopify will set the type to
`customization_field` — leave it as that, the theme looks for it by reference,
not by name.

Add these fields. The **key** must match exactly; the name is yours to change.

| Field name | Key | Type | Notes |
|---|---|---|---|
| Label | `label` | Single line text | Required. What the shopper sees. A field with no label is skipped. |
| Field type | `field_type` | Single line text | One of `swatch`, `select`, `text`, `textarea`, `file`. Set a list of choices so it is a dropdown in admin. Anything unrecognised renders as `text`. |
| Values | `values` | Single line text | For `swatch` and `select`. Comma separated. |
| Hint | `hint` | Single line text | Optional helper line under the label. |
| Required | `required` | True or false | |
| Max length | `max_length` | Integer | `text` and `textarea` only. |
| Placeholder | `placeholder` | Single line text | `select` only. |
| Accepted types | `accept` | Single line text | `file` only, e.g. `image/jpeg,image/png,application/pdf`. |
| Max size | `max_size_mb` | Integer | `file` only, in MB. |

Only `label` and `field_type` matter for every field; the rest apply per type
and can be left empty.

### Swatch colours

A swatch value can carry its own colour:

```
Terracotta:#b45f3f, Oatmeal:#d8c9ae, Ink:#22314a
```

Without a colour the chip falls back to the theme's brand palette by name
(`charcoal`, `bone`, `sage`, `rust`, `sea-glass` and so on), and a name the
palette does not know renders as a neutral chip. **Put the hex in the value.**
That is what makes a new colour a matter of typing it in the admin.

---

## 2. Create the product metafield

**Settings → Custom data → Products → Add definition**

| | |
|---|---|
| Name | Customization fields |
| Namespace and key | `custom.customization_fields` |
| Type | Metaobject → **List of** `Customization field` |

The namespace and key are not hardcoded — the product template has a
**Per-product fields** setting in the theme editor if you would rather use a
different one.

---

## 3. Set it per product

On any product, scroll to **Metafields → Customization fields**, and add
entries in the order they should appear.

**A product with nothing configured shows nothing** — no fields, no "Make it
yours" heading. The theme ships no customization fields of its own, so what a
shopper is asked for is exactly what is set here and nowhere else.

### Where the panel appears

The product template has a **Customization** block in the theme editor. It
holds no field definitions — it is only a *position*, deciding whether
personalising comes before or after the quantity. Its optional **Heading**
overrides the translated default.

The theme can still define fields for the whole catalogue, via the individual
Colour swatches / Dropdown / Short text / Long text / File upload blocks. That
is for a catalogue where every product genuinely takes the same options.
Nothing ships using them, and a product's own list wins outright — showing both
would be worse than either.

---

## Variant swatches

Variant options (Colour, Glaze, Finish) are a separate thing, and they use
**Shopify's native option swatches**. On the product's option values, set a
colour or upload an image; the theme reads `value.swatch.color` and
`value.swatch.image` and renders it.

If a variant swatch is showing as a plain beige circle, the option value has no
swatch set in the admin. The named palette in `assets/component-swatches.css`
is only a fallback for the brand's own colours — adding entries there is not
how a merchant adds a colour.

**Which options render as swatches** is decided by the data first: any option
with a native swatch on one of its values is treated as a colour option, no
configuration needed. For options with no swatches set yet, the theme falls
back to matching the option *name* against **Theme settings → Product options →
Swatch option names** (`colour, color, finish, glaze, colourway, colorway` by
default). Matching is on substring, so `2nd Colour` and `Glaze colour` both
count. Everything else renders as a segmented button list.

---

## What reaches the order

Every field posts as a Shopify **line item property**, so the choice travels
with the line through the cart and into the order with no app involved. The
property name is the label unless `property_name` overrides it.

**Fields cannot change the price.** A line item property is a label, not a
price adjustment, and enforcing a surcharge in browser JS would be trivially
bypassed. Priced options need either variants or a Shopify Function — see the
open decision in `docs/STATUS.md`.
