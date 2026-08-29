# Desktop features with adapted mobile interactions

Every entry below is a case where the mobile interaction genuinely differs
from desktop. In no case is information or functionality removed — only the
interaction changes.

## Navigation

| Desktop (≥1024px) | Mobile | Why |
|---|---|---|
| Horizontal nav bar with hover dropdowns | Bottom-sheet menu opened from a hamburger | Hover does not exist on touch. A bottom sheet also puts the links in thumb reach, where a top-anchored panel puts the close control in the hardest corner of a 6-inch screen. |
| Dropdown on hover | Second level expands in place inside `<details>` | Works with zero JavaScript, keeps the parent visible so you never lose your place, and needs no focus restoration — the bug class sliding panels reliably produce with iOS VoiceOver. |
| Account link in the header | Moved into the menu sheet footer | Keeps the mobile top bar to three thumb-sized targets. Nothing is hidden — it is one tap away and pinned where the thumb rests. |

The inline nav is **not** `display:none` on mobile — it is not rendered at all,
so a phone never downloads a second copy of the menu markup.

## Search

| Desktop | Mobile | Why |
|---|---|---|
| Dropdown panel below the header | Full-height sheet | Once the keyboard is up a dropdown has about two visible rows left. The sheet pins the field to the top of the remaining space and gives results the rest. `interactive-widget=resizes-content` makes the keyboard shrink the viewport rather than cover it. |

## Collection filtering and sorting

| Desktop | Mobile | Why |
|---|---|---|
| Persistent left sidebar | Bottom sheet, opened from a sticky toolbar | No room for a sidebar. The toolbar is sticky so changing sort after twelve rows does not mean scrolling back to the top. |
| Filters apply on change | Explicit **Apply filters** button | Live-applying results behind a modal you cannot see through is disorienting. |
| — | Active filters shown as removable chips | Once the sheet closes, a filtered grid is otherwise indistinguishable from a nearly empty catalogue. |

The filter markup is rendered **once** and repositioned with CSS — the sheet
and the sidebar are the same DOM, so there is never a second set of controls
to keep in sync.

## Product gallery

| Desktop | Mobile | Why |
|---|---|---|
| Thumbnail strip | Dot indicators | Thumbnails would cost a row of vertical space to duplicate what dots already do. |
| Prev/next arrows | Swipe (arrows hidden) | Arrows are shown only under `(hover: hover) and (pointer: fine)`. Swipe is the expected gesture; the dots remain as the accessible non-gesture route. |

The swipe itself is CSS `scroll-snap`, not JavaScript — native momentum, and it
still works before the script loads. Each dot is a real `<button>` with a 44px
hit area around an 8px mark.

## Add to cart

| Desktop | Mobile | Why |
|---|---|---|
| Sticky product info column keeps the button on screen | Sticky bottom bar reveals after the inline button scrolls away | There is no room for a sticky column on a phone. The bar hides again when the inline button returns, so it costs nothing at first paint. |

The bar retires entirely at ≥1024px, where the sticky column already does the
job. **Approved design.**

## Cart

| Desktop | Mobile | Why |
|---|---|---|
| Right side panel | Bottom sheet | Thumb reach. Checkout is the last element, nearest the thumb. |
| Summary as a sticky sidebar | Summary after the items | Matches the order the decision is actually made in. |

Customization properties are shown in full on every screen size. Hiding what
someone personalised is exactly the essential information that must not be
dropped to tidy a mobile layout.

## Product cards

| Desktop | Mobile | Why |
|---|---|---|
| Hover lift, image zoom, second-image swap | None | Touch has no hover state. The rules are inside a `(hover: hover)` query, so they are never evaluated and the second image is never decoded on a phone. |
| Colour swatches | Same — presentational, not interactive | At card width a tappable swatch would be far under 44px, and tapping one would raise the question of what it selects. Choosing happens on the product page. |

## Footer

| Desktop | Mobile | Why |
|---|---|---|
| Columns open | Columns collapse into accordions | Vertical space. |

Columns render **open** and are collapsed by script below 768px, never the
other way round. CSS cannot force a `<details>` open, so shipping them closed
would hide footer navigation from anyone whose JavaScript fails.

## Hero

| Desktop | Mobile | Why |
|---|---|---|
| Text overlaid on the image | Text stacked below the image | Overlaid text on a phone means either an unreadable contrast ratio or a scrim heavy enough to hide the photograph. |
| Wide crop | Separate portrait crop via `<picture>` | A 16:9 banner scaled to 390px leaves the subject a thumbnail. |
| Decorative bee/leaf motifs | Hidden | The viewport cannot spare the room and the GPU cannot spare the work. |
