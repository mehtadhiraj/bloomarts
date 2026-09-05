# Bloom Arts SEO guide

This theme uses **gifting as the primary search theme**, with home décor and
materials as supporting topics. The keyword set below is based on current
Indian search-result language and close competitors, then narrowed to terms
that match the actual Bloom Arts catalogue. It is a relevance map, not a
claim of exact search volume; validate priorities against real impressions in
Google Search Console after launch.

## Keyword map

Use one primary topic per page. Variants belong naturally in the copy; do not
repeat a phrase merely to increase density.

| Page or collection | Primary phrase | Closely related phrases |
|---|---|---|
| Homepage | unique gifts online India | home decor online India; home decor and gifts; thoughtful gifts |
| Personalised | personalised gifts online India | personalized gifts India; custom gifts; customised gifts |
| Housewarming | housewarming gifts India | house warming gifts; new home gifts; home decor gifts |
| Birthday | unique birthday gifts | birthday gifts online India; thoughtful birthday gifts |
| Wedding | wedding gifts India | personalised wedding gifts; wedding return gifts |
| Festive | festive gifts India | Diwali gifts; festive home decor; curated gift hampers |
| Corporate | corporate gifting India | corporate gifts in bulk; employee gifts; client gifts |
| Home décor | unique home decor India | modern home decor; decorative objects; small home accents |
| Concrete | concrete planters India | concrete home decor; concrete desk accessories |
| Clay | clay home decor | ceramic gifts; stoneware mugs; decorative vases |
| Resin | resin gifts | resin trays; resin coasters; personalised resin gifts |

Create an occasion collection only when it has enough relevant products and
useful original copy. Do not create thin landing pages for every keyword.

## Recommended Shopify search listings

### Homepage

- **Title:** `Unique Gifts & Home Decor Online India | Bloom Arts`
- **Description:** `Shop unique gifts and home decor online in India. Discover personalised gifts, studio-made pieces and thoughtful finds for every happy occasion.`

The theme uses these as configurable fallbacks. Set the same or improved copy
under **Online Store → Preferences**; Shopify's native value takes priority.

### Collection formula

- **Title:** `[Occasion or category] Online India | Bloom Arts`
- **Description:** `Shop [category] for [audience or occasion]. Discover [two
  useful product types or benefits], with delivery across India.`

Keep titles unique and near 60 characters. Keep descriptions natural and near
160 characters. The actual title, collection description and SEO fields must
be maintained in Shopify Admin because they depend on live catalogue data.

### Product formula

- **Title:** `[Descriptive product name] – [material/use] | Bloom Arts`
- **Description:** `Shop the [product name], a [material/style] [product type]
  for [use or occasion]. [Key size, finish, personalisation or delivery fact].`

Never reuse a supplier's dropshipping description verbatim. Write original
copy based on verified product details, use case, dimensions, care, materials
and gifting occasion. This avoids duplicate catalogue copy and gives shoppers
information worth ranking.

## Required launch actions

1. Create useful collections for the occasions the live catalogue genuinely
   serves: personalised, housewarming, birthday, wedding, festive and
   corporate gifting are the current priority candidates.
2. Add a unique Shopify SEO title, meta description, H1 and substantive
   collection description to every indexable collection.
3. Give every product a descriptive title, original description, product
   type, vendor/brand, SKU, barcode when available, accurate price and stock,
   and descriptive image alt text.
4. Keep sourced products labelled honestly. Use the real vendor in Shopify;
   reserve “studio-made” or material craft claims for Bloom Arts products.
5. Connect the store to Google Search Console and submit
   `https://YOUR-DOMAIN/sitemap.xml`. Shopify creates and updates this file.
6. Connect Shopify's Google & YouTube channel or another verified feed to
   Google Merchant Center. Configure shipping costs and delivery times for
   India, which Google requires for Indian free product listings.
7. Publish complete shipping, return, privacy, contact and terms pages. Add
   structured shipping and return policy data only after those facts are
   final and match the storefront.
8. Request indexing for the homepage and priority collections after launch,
   then use Search Console queries and conversion data to refine this map.
9. Earn relevant links and mentions from gift guides, local publications,
   interior-design sites, event planners and genuine customer reviews.
10. Recheck mobile Core Web Vitals after installing Shopify apps; third-party
    scripts are a common source of regressions.

## Technical SEO included in the theme

- Unique title and meta-description fallbacks with native Shopify fields
  taking priority.
- Canonical URLs.
- Indexing guards for search, cart, customer and 404 utility pages.
- Open Graph and X/Twitter cards with secure images and product price data.
- `Organization` and `WebSite` structured data on the homepage.
- `Product` and per-variant `Offer` structured data on product pages.
- `BreadcrumbList` structured data on indexable inner pages.
- Mobile-first responsive images with intrinsic dimensions and meaningful
  product alt fallbacks.
- Crawlable HTML links and server-rendered product grids.
- A `robots.txt.liquid` pass-through that retains Shopify's maintained rules
  and its fully qualified sitemap declaration.
- Optional Google Search Console and Bing Webmaster Tools verification codes
  under the theme's Search engine optimization settings.

Shopify's native sitemap is intentionally not replaced: `sitemap.xml` is a
platform endpoint, not a theme asset, and Shopify updates it whenever products,
collections, pages, blog posts or primary product images change. The robots
template iterates Shopify's default objects instead of copying static rules,
so future platform updates continue to flow through. If the theme is installed
by ZIP through Shopify Admin, Shopify does not import `robots.txt.liquid`; use
the GitHub integration, Shopify CLI, or add the same template in the code
editor after upload.

## Research references

- [Google ecommerce SEO guidance](https://developers.google.com/search/docs/specialty/ecommerce)
- [Google ecommerce site structure guidance](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure)
- [Google Product structured data](https://developers.google.com/search/docs/appearance/structured-data/product-snippet)
- [Google Breadcrumb structured data](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)
- [Shopify SEO overview](https://help.shopify.com/en/manual/promoting-marketing/seo/seo-overview)
- [Shopify keyword guidance](https://help.shopify.com/en/manual/promoting-marketing/seo/adding-keywords)
- [Shopify sitemap guidance](https://help.shopify.com/en/manual/promoting-marketing/seo/find-site-map)
- [Shopify robots.txt guidance](https://help.shopify.com/en/manual/promoting-marketing/seo/editing-robots-txt)
- [Google free product listings](https://support.google.com/merchants/answer/13889434)
