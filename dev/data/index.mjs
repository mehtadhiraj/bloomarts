/* ==========================================================================
   Mock storefront data for the local harness.

   Shapes mirror the Shopify Liquid objects the theme actually touches. This
   is NOT a Shopify emulator — it exists so layout, touch targets, contrast
   and reflow can be validated at real viewport widths without a store.
   ========================================================================== */

const CURRENCY = 'INR';

/* Deterministic placeholder art. Real photography is not needed to validate
   layout, but correct intrinsic dimensions are — every image below declares
   them so reserved space matches the shipping theme. */
function image(handle, index, tint, w = 1600, h = 2000) {
  return {
    id: `${handle}-${index}`,
    alt: '',
    src: `/img/${handle}-${index}.svg`,
    width: w,
    height: h,
    aspect_ratio: w / h,
    tint
  };
}

function variant(id, title, price, options, available = true, compareAt = null) {
  return {
    id,
    title,
    price,
    compare_at_price: compareAt,
    available,
    options,
    option1: options[0] || null,
    option2: options[1] || null,
    option3: options[2] || null,
    sku: `BA-${id}`,
    inventory_quantity: available ? 12 : 0,
    requires_shipping: true,
    featured_image: null
  };
}


/* Builds one "customization_field" metaobject the way Shopify hands it to
   Liquid. See docs/CUSTOMIZATION-FIELDS.md for the admin definition. */
function customizationField(fields) {
  const entry = {};
  for (const [key, value] of Object.entries(fields)) entry[key] = { value };
  return entry;
}

function product(config) {
  const prices = config.variants.map((v) => v.price);
  const priceMin = Math.min(...prices);
  const priceMax = Math.max(...prices);
  const firstAvailable = config.variants.find((v) => v.available) || config.variants[0];

  return {
    id: config.id,
    title: config.title,
    handle: config.handle,
    url: `/products/${config.handle}`,
    vendor: 'Bloom Arts',
    type: config.type,
    available: config.variants.some((v) => v.available),
    tags: config.tags || [],
    price: priceMin,
    price_min: priceMin,
    price_max: priceMax,
    price_varies: priceMin !== priceMax,
    compare_at_price: firstAvailable.compare_at_price,
    compare_at_price_max: Math.max(...config.variants.map((v) => v.compare_at_price || 0)),
    description: config.description,
    content: config.description,
    featured_image: config.images[0],
    images: config.images,
    media: config.images.map((img, i) => ({
      id: `${config.handle}-media-${i}`,
      media_type: 'image',
      alt: img.alt,
      preview_image: img,
      ...img
    })),
    options: config.options.map((o) => o.name),
    options_with_values: config.options,
    has_only_default_variant: false,
    variants: config.variants,
    first_available_variant: firstAvailable,
    selected_variant: null,
    selected_or_first_available_variant: firstAvailable,
    /* Per-product customization is configured in the Shopify admin, so the
       harness has to be able to stand in for it. A metaobject field is a
       drop that renders as its value, which is why every value sits under
       .value here rather than being a bare string. */
    metafields: config.metafields || {},
    collections: config.collections || []
  };
}

const products = [
  product({
    id: 1001,
    title: 'Monolith Concrete Planter',
    handle: 'monolith-concrete-planter',
    type: 'Planter',
    tags: ['concrete', 'planters', 'indoor'],
    collections: ['concrete', 'planters'],
    description:
      '<p>Cast by hand in fibre-reinforced concrete, each Monolith carries the faint pitting and tonal drift of the pour. Sealed inside and out, with a drainage hole and cork foot.</p>',
    images: [
      image('monolith-concrete-planter', 1, '#8d8880'),
      image('monolith-concrete-planter', 2, '#a09a91'),
      image('monolith-concrete-planter', 3, '#736e67'),
      image('monolith-concrete-planter', 4, '#b5aea4')
    ],
    options: [
      { name: 'Size', values: ['Small', 'Medium', 'Large'], position: 1 },
      { name: 'Finish', values: ['Charcoal', 'Bone', 'Sage'], position: 2 }
    ],
    variants: [
      variant(20001, 'Small / Charcoal', 245000, ['Small', 'Charcoal']),
      variant(20002, 'Small / Bone', 245000, ['Small', 'Bone']),
      variant(20003, 'Small / Sage', 245000, ['Small', 'Sage'], false),
      variant(20004, 'Medium / Charcoal', 320000, ['Medium', 'Charcoal']),
      variant(20005, 'Medium / Bone', 320000, ['Medium', 'Bone']),
      variant(20006, 'Medium / Sage', 320000, ['Medium', 'Sage']),
      variant(20007, 'Large / Charcoal', 425000, ['Large', 'Charcoal'], true, 480000),
      variant(20008, 'Large / Bone', 425000, ['Large', 'Bone'], true, 480000),
      variant(20009, 'Large / Sage', 425000, ['Large', 'Sage'], false, 480000)
    ]
  }),

  product({
    id: 1002,
    title: 'Ridge Stoneware Vase',
    handle: 'ridge-stoneware-vase',
    metafields: {
      custom: {
        customization_fields: {
          value: [
            customizationField({
              label: 'Glaze accent',
              field_type: 'swatch',
              // Colours carried in the values, so a shade the theme's palette
              // has never heard of still renders as itself.
              values: 'Terracotta:#b45f3f, Oatmeal:#d8c9ae, Ink:#22314a',
              hint: 'Brushed on by hand, so the edge is never quite the same.',
              required: false
            }),
            customizationField({
              label: 'Rim finish',
              field_type: 'select',
              values: 'Raw clay, Glazed, Gilded',
              placeholder: 'Choose a rim',
              required: true
            }),
            customizationField({
              label: 'Initials',
              field_type: 'text',
              max_length: 3,
              hint: 'Up to three letters, stamped into the foot.',
              required: false
            })
          ]
        }
      }
    },
    type: 'Vase',
    tags: ['clay', 'vases'],
    collections: ['clay', 'vases'],
    description:
      '<p>Thrown in speckled stoneware and left with the throwing ridges intact. Food-safe glaze inside; raw clay foot.</p>',
    images: [
      image('ridge-stoneware-vase', 1, '#b9a58c'),
      image('ridge-stoneware-vase', 2, '#8f7c66'),
      image('ridge-stoneware-vase', 3, '#cbb9a1')
    ],
    options: [
      { name: 'Height', values: ['Short', 'Tall'], position: 1 },
      { name: 'Glaze', values: ['Oatmeal', 'Ash', 'Rust'], position: 2 }
    ],
    variants: [
      variant(20101, 'Short / Oatmeal', 189000, ['Short', 'Oatmeal']),
      variant(20102, 'Short / Ash', 189000, ['Short', 'Ash']),
      variant(20103, 'Short / Rust', 189000, ['Short', 'Rust']),
      variant(20104, 'Tall / Oatmeal', 264000, ['Tall', 'Oatmeal']),
      variant(20105, 'Tall / Ash', 264000, ['Tall', 'Ash'], false),
      variant(20106, 'Tall / Rust', 264000, ['Tall', 'Rust'])
    ]
  }),

  product({
    id: 1003,
    title: 'Tide Resin Coaster Set',
    handle: 'tide-resin-coaster-set',
    type: 'Coasters',
    tags: ['resin', 'tabletop', 'gifting'],
    collections: ['resin', 'tabletop'],
    description:
      '<p>Four coasters poured in layered pigment so no two sets are alike. Heat resistant to 120&deg;C with a felted underside.</p>',
    images: [
      image('tide-resin-coaster-set', 1, '#6f93a0'),
      image('tide-resin-coaster-set', 2, '#9db8c1'),
      image('tide-resin-coaster-set', 3, '#4d6c78')
    ],
    options: [{ name: 'Colourway', values: ['Sea Glass', 'Amber', 'Ink'], position: 1 }],
    variants: [
      variant(20201, 'Sea Glass', 145000, ['Sea Glass']),
      variant(20202, 'Amber', 145000, ['Amber']),
      variant(20203, 'Ink', 145000, ['Ink'])
    ]
  }),

  product({
    id: 1004,
    title: 'Strata Resin Tray',
    handle: 'strata-resin-tray',
    type: 'Tray',
    tags: ['resin', 'tabletop', 'personalised'],
    collections: ['resin', 'tabletop', 'personalised'],
    description:
      '<p>A poured tray with geological banding, finished with brass handles. Add an engraved line to the underside for gifting.</p>',
    images: [
      image('strata-resin-tray', 1, '#a3785f'),
      image('strata-resin-tray', 2, '#c49b7f'),
      image('strata-resin-tray', 3, '#7d5943'),
      image('strata-resin-tray', 4, '#d8b9a0')
    ],
    options: [
      { name: 'Size', values: ['Ø22 cm', 'Ø30 cm'], position: 1 },
      { name: 'Colourway', values: ['Canyon', 'Dune', 'Basalt'], position: 2 }
    ],
    variants: [
      variant(20301, 'Ø22 cm / Canyon', 298000, ['Ø22 cm', 'Canyon']),
      variant(20302, 'Ø22 cm / Dune', 298000, ['Ø22 cm', 'Dune']),
      variant(20303, 'Ø22 cm / Basalt', 298000, ['Ø22 cm', 'Basalt']),
      variant(20304, 'Ø30 cm / Canyon', 386000, ['Ø30 cm', 'Canyon']),
      variant(20305, 'Ø30 cm / Dune', 386000, ['Ø30 cm', 'Dune']),
      variant(20306, 'Ø30 cm / Basalt', 386000, ['Ø30 cm', 'Basalt'], false)
    ]
  }),

  product({
    id: 1005,
    title: 'Ember Concrete Tealight Trio',
    handle: 'ember-concrete-tealight-trio',
    type: 'Candle holder',
    tags: ['concrete', 'tabletop', 'gifting'],
    collections: ['concrete', 'tabletop'],
    description: '<p>Three stepped holders cast in pale concrete. Fits standard tealights.</p>',
    images: [image('ember-concrete-tealight-trio', 1, '#b0aaa1'), image('ember-concrete-tealight-trio', 2, '#8b857c')],
    options: [{ name: 'Finish', values: ['Bone', 'Charcoal'], position: 1 }],
    variants: [
      variant(20401, 'Bone', 132000, ['Bone']),
      variant(20402, 'Charcoal', 132000, ['Charcoal'])
    ]
  }),

  product({
    id: 1006,
    title: 'Kiln Clay Incense Holder',
    handle: 'kiln-clay-incense-holder',
    type: 'Incense holder',
    tags: ['clay', 'tabletop'],
    collections: ['clay', 'tabletop'],
    description: '<p>Pinched terracotta with an unglazed rim and a shallow ash well.</p>',
    images: [image('kiln-clay-incense-holder', 1, '#b6704f'), image('kiln-clay-incense-holder', 2, '#8d5238')],
    options: [{ name: 'Glaze', values: ['Raw', 'Milk'], position: 1 }],
    variants: [
      variant(20501, 'Raw', 78000, ['Raw']),
      variant(20502, 'Milk', 86000, ['Milk'])
    ]
  }),

  product({
    id: 1007,
    title: 'Plinth Concrete Bookends',
    handle: 'plinth-concrete-bookends',
    type: 'Bookends',
    tags: ['concrete', 'desk', 'multipurpose'],
    collections: ['concrete', 'desk'],
    description: '<p>A weighted pair, 2.4 kg each, with cork bases that will not mark a shelf.</p>',
    images: [image('plinth-concrete-bookends', 1, '#94908a'), image('plinth-concrete-bookends', 2, '#6e6a64')],
    options: [{ name: 'Finish', values: ['Charcoal', 'Bone'], position: 1 }],
    variants: [
      variant(20601, 'Charcoal', 340000, ['Charcoal']),
      variant(20602, 'Bone', 340000, ['Bone'])
    ]
  }),

  product({
    id: 1008,
    title: 'Flux Resin Desk Caddy',
    handle: 'flux-resin-desk-caddy',
    type: 'Organiser',
    tags: ['resin', 'desk', 'multipurpose', 'personalised'],
    collections: ['resin', 'desk', 'personalised'],
    description:
      '<p>Three compartments for pens, cables or brushes — a genuinely multipurpose block. Poured to order in your chosen pigment.</p>',
    images: [
      image('flux-resin-desk-caddy', 1, '#7a7f9c'),
      image('flux-resin-desk-caddy', 2, '#a0a4bd'),
      image('flux-resin-desk-caddy', 3, '#585d78')
    ],
    options: [{ name: 'Colourway', values: ['Slate', 'Mist', 'Midnight'], position: 1 }],
    variants: [
      variant(20701, 'Slate', 218000, ['Slate']),
      variant(20702, 'Mist', 218000, ['Mist']),
      variant(20703, 'Midnight', 232000, ['Midnight'])
    ]
  }),

  product({
    id: 1009,
    title: 'Speckle Stoneware Mug',
    handle: 'speckle-stoneware-mug',
    type: 'Mug',
    tags: ['clay', 'tabletop'],
    collections: ['clay', 'tabletop'],
    description: '<p>320 ml, dishwasher safe, with a handle sized for a full grip.</p>',
    images: [image('speckle-stoneware-mug', 1, '#c2b49c'), image('speckle-stoneware-mug', 2, '#9b8b73')],
    options: [{ name: 'Glaze', values: ['Oatmeal', 'Ash', 'Rust', 'Milk'], position: 1 }],
    variants: [
      variant(20801, 'Oatmeal', 94000, ['Oatmeal']),
      variant(20802, 'Ash', 94000, ['Ash']),
      variant(20803, 'Rust', 94000, ['Rust'], false),
      variant(20804, 'Milk', 94000, ['Milk'])
    ]
  }),

  product({
    id: 1010,
    title: 'Basin Concrete Soap Dish',
    handle: 'basin-concrete-soap-dish',
    type: 'Bath',
    tags: ['concrete', 'bath'],
    collections: ['concrete', 'bath'],
    description: '<p>A slotted dish that drains rather than pools. Sealed against constant damp.</p>',
    images: [image('basin-concrete-soap-dish', 1, '#a6a29b'), image('basin-concrete-soap-dish', 2, '#7f7b75')],
    options: [{ name: 'Finish', values: ['Bone', 'Sage'], position: 1 }],
    variants: [
      variant(20901, 'Bone', 68000, ['Bone']),
      variant(20902, 'Sage', 68000, ['Sage'])
    ]
  }),

  product({
    id: 1011,
    title: 'Halo Concrete Wall Hooks',
    handle: 'halo-concrete-wall-hooks',
    type: 'Hooks',
    tags: ['concrete', 'multipurpose', 'entryway'],
    collections: ['concrete', 'entryway'],
    description: '<p>A set of three. Rated to 4 kg each with the supplied wall plugs.</p>',
    images: [image('halo-concrete-wall-hooks', 1, '#9c9790'), image('halo-concrete-wall-hooks', 2, '#7b766f')],
    options: [{ name: 'Finish', values: ['Bone', 'Charcoal'], position: 1 }],
    variants: [
      variant(21001, 'Bone', 156000, ['Bone']),
      variant(21002, 'Charcoal', 156000, ['Charcoal'])
    ]
  }),

  product({
    id: 1012,
    title: 'Drift Resin Jewellery Dish',
    handle: 'drift-resin-jewellery-dish',
    type: 'Dish',
    tags: ['resin', 'gifting', 'personalised'],
    collections: ['resin', 'personalised'],
    description: '<p>A small pooled dish for rings and studs. Add up to 24 engraved characters.</p>',
    images: [image('drift-resin-jewellery-dish', 1, '#c98f9c'), image('drift-resin-jewellery-dish', 2, '#a76d7a')],
    options: [{ name: 'Colourway', values: ['Blush', 'Sea Glass', 'Ink'], position: 1 }],
    variants: [
      variant(21101, 'Blush', 88000, ['Blush']),
      variant(21102, 'Sea Glass', 88000, ['Sea Glass']),
      variant(21103, 'Ink', 88000, ['Ink'])
    ]
  })
];

const byHandle = Object.fromEntries(products.map((p) => [p.handle, p]));

function collection(handle, title, description, tag) {
  const items = products.filter((p) => p.collections.includes(tag));
  return {
    id: `col-${handle}`,
    handle,
    title,
    description,
    url: `/collections/${handle}`,
    products: items,
    all_products_count: items.length,
    products_count: items.length,
    featured_image: items[0] ? items[0].featured_image : null,
    image: items[0] ? items[0].featured_image : null,
    filters: [],
    sort_options: [
      { value: 'manual', name: 'Featured' },
      { value: 'best-selling', name: 'Best selling' },
      { value: 'title-ascending', name: 'Alphabetically, A–Z' },
      { value: 'price-ascending', name: 'Price, low to high' },
      { value: 'price-descending', name: 'Price, high to low' },
      { value: 'created-descending', name: 'Date, new to old' }
    ],
    sort_by: 'manual',
    default_sort_by: 'manual'
  };
}

const collections = {
  concrete: collection('concrete', 'Concrete', 'Cast, cured and sealed by hand.', 'concrete'),
  clay: collection('clay', 'Clay', 'Thrown and pinched stoneware and terracotta.', 'clay'),
  resin: collection('resin', 'Resin', 'Poured in layered pigment, never twice the same.', 'resin'),
  tabletop: collection('tabletop', 'Tabletop', 'For the surfaces you use every day.', 'tabletop'),
  desk: collection('desk', 'Desk', 'Multipurpose pieces that earn their footprint.', 'desk'),
  personalised: collection('personalised', 'Personalised', 'Made to your specification.', 'personalised'),
  planters: collection('planters', 'Planters', '', 'planters'),
  vases: collection('vases', 'Vases', '', 'vases'),
  bath: collection('bath', 'Bath', '', 'bath'),
  entryway: collection('entryway', 'Entryway', '', 'entryway')
};

collections.all = {
  ...collection('all', 'All products', 'Everything currently in stock.', ''),
  products,
  all_products_count: products.length,
  products_count: products.length
};

/* Filters exercise every control type the facet sheet must handle:
   list checkboxes, a swatch list, and a price range with two inputs. */
collections.concrete.filters = [
  {
    label: 'Finish',
    param_name: 'filter.p.m.custom.finish',
    type: 'list',
    active_values: [],
    values: [
      { label: 'Charcoal', value: 'charcoal', count: 4, active: false, url_to_add: '?filter.p.m.custom.finish=charcoal', url_to_remove: '?' },
      { label: 'Bone', value: 'bone', count: 5, active: false, url_to_add: '?filter.p.m.custom.finish=bone', url_to_remove: '?' },
      { label: 'Sage', value: 'sage', count: 2, active: false, url_to_add: '?filter.p.m.custom.finish=sage', url_to_remove: '?' }
    ]
  },
  {
    label: 'Product type',
    param_name: 'filter.p.product_type',
    type: 'list',
    active_values: [],
    values: [
      { label: 'Planter', value: 'Planter', count: 1, active: false, url_to_add: '?filter.p.product_type=Planter', url_to_remove: '?' },
      { label: 'Candle holder', value: 'Candle holder', count: 1, active: false, url_to_add: '?', url_to_remove: '?' },
      { label: 'Bookends', value: 'Bookends', count: 1, active: false, url_to_add: '?', url_to_remove: '?' },
      { label: 'Bath', value: 'Bath', count: 1, active: false, url_to_add: '?', url_to_remove: '?' },
      { label: 'Hooks', value: 'Hooks', count: 1, active: false, url_to_add: '?', url_to_remove: '?' }
    ]
  },
  {
    label: 'Price',
    param_name: 'filter.v.price',
    type: 'price_range',
    active_values: [],
    min_value: { value: null, param_name: 'filter.v.price.gte' },
    max_value: { value: null, param_name: 'filter.v.price.lte' },
    range_max: 500000,
    values: []
  }
];

const cart = {
  item_count: 3,
  total_price: 708000,
  original_total_price: 708000,
  items_subtotal_price: 708000,
  currency: CURRENCY,
  note: '',
  cart_level_discount_applications: [],
  items: [
    {
      key: '20004:aa11',
      id: 20004,
      quantity: 1,
      url: '/products/monolith-concrete-planter',
      title: 'Monolith Concrete Planter - Medium / Charcoal',
      product: byHandle['monolith-concrete-planter'],
      image: byHandle['monolith-concrete-planter'].images[0],
      options_with_values: [
        { name: 'Size', value: 'Medium' },
        { name: 'Finish', value: 'Charcoal' }
      ],
      /* Shopify yields [key, value] pairs when iterating line item
         properties, so the mock uses pairs directly. */
      properties: [
        ['Engraving', 'For Ananya — 2026'],
        ['Gift message', 'Congratulations on the new flat. Hope it finds a sunny corner.'],
        ['_internal_ref', 'should-not-render']
      ],
      original_line_price: 320000,
      final_line_price: 320000,
      line_level_discount_allocations: [],
      selling_plan_allocation: null,
      error_message: null
    },
    {
      key: '20301:bb22',
      id: 20301,
      quantity: 2,
      url: '/products/strata-resin-tray',
      title: 'Strata Resin Tray - Ø22 cm / Canyon',
      product: byHandle['strata-resin-tray'],
      image: byHandle['strata-resin-tray'].images[0],
      options_with_values: [
        { name: 'Size', value: 'Ø22 cm' },
        { name: 'Colourway', value: 'Canyon' }
      ],
      properties: [['Reference image', '/uploads/kitchen-palette-reference.jpg']],
      original_line_price: 596000,
      final_line_price: 596000,
      line_level_discount_allocations: [],
      selling_plan_allocation: null,
      error_message: null
    },
    {
      key: '20801:cc33',
      id: 20801,
      quantity: 1,
      url: '/products/speckle-stoneware-mug',
      title: 'Speckle Stoneware Mug - Oatmeal',
      product: byHandle['speckle-stoneware-mug'],
      image: byHandle['speckle-stoneware-mug'].images[0],
      options_with_values: [{ name: 'Glaze', value: 'Oatmeal' }],
      properties: [],
      original_line_price: 94000,
      final_line_price: 94000,
      line_level_discount_allocations: [],
      selling_plan_allocation: null,
      error_message: null
    }
  ]
};
cart.total_price = cart.items.reduce((sum, i) => sum + i.final_line_price, 0);
cart.item_count = cart.items.reduce((sum, i) => sum + i.quantity, 0);

const linklists = {
  'main-menu': {
    title: 'Main menu',
    handle: 'main-menu',
    links: [
      {
        title: 'Shop all',
        url: '/collections/all',
        current: false,
        child_active: false,
        links: []
      },
      {
        title: 'Concrete',
        url: '/collections/concrete',
        current: false,
        child_active: false,
        links: [
          { title: 'Planters', url: '/collections/planters', current: false, links: [] },
          { title: 'Tabletop', url: '/collections/tabletop', current: false, links: [] },
          { title: 'Bath', url: '/collections/bath', current: false, links: [] },
          { title: 'Entryway', url: '/collections/entryway', current: false, links: [] }
        ]
      },
      {
        title: 'Clay',
        url: '/collections/clay',
        current: false,
        child_active: false,
        links: [
          { title: 'Vases', url: '/collections/vases', current: false, links: [] },
          { title: 'Mugs', url: '/collections/tabletop', current: false, links: [] }
        ]
      },
      {
        title: 'Resin',
        url: '/collections/resin',
        current: false,
        child_active: false,
        links: [
          { title: 'Trays', url: '/collections/tabletop', current: false, links: [] },
          { title: 'Desk', url: '/collections/desk', current: false, links: [] }
        ]
      },
      { title: 'Personalised', url: '/collections/personalised', current: false, child_active: false, links: [] },
      { title: 'Our studio', url: '/pages/about', current: false, child_active: false, links: [] }
    ]
  },
  'footer-help': {
    title: 'Help',
    handle: 'footer-help',
    links: [
      { title: 'Shipping & returns', url: '/pages/shipping', current: false, links: [] },
      { title: 'Care instructions', url: '/pages/care', current: false, links: [] },
      { title: 'Track an order', url: '/pages/track', current: false, links: [] },
      { title: 'Contact us', url: '/pages/contact', current: false, links: [] }
    ]
  },
  'footer-shop': {
    title: 'Shop',
    handle: 'footer-shop',
    links: [
      { title: 'Concrete', url: '/collections/concrete', current: false, links: [] },
      { title: 'Clay', url: '/collections/clay', current: false, links: [] },
      { title: 'Resin', url: '/collections/resin', current: false, links: [] },
      { title: 'Personalised', url: '/collections/personalised', current: false, links: [] }
    ]
  }
};

const shop = {
  name: 'Bloom Arts',
  description: 'Handmade concrete, clay and resin pieces. Little Creations, Big Smiles.',
  url: 'https://bloomarts.example',
  domain: 'bloomarts.example',
  email: 'studio@bloomarts.example',
  currency: CURRENCY,
  money_format: '₹{{amount}}',
  money_with_currency_format: '₹{{amount}} INR',
  customer_accounts_enabled: true,
  enabled_payment_types: ['visa', 'master', 'american_express', 'paypal'],
  privacy_policy: { url: '/policies/privacy-policy', title: 'Privacy policy' },
  refund_policy: { url: '/policies/refund-policy', title: 'Refund policy' },
  terms_of_service: { url: '/policies/terms-of-service', title: 'Terms of service' }
};

const routes = {
  root_url: '/',
  all_products_collection_url: '/collections/all',
  collections_url: '/collections',
  cart_url: '/cart',
  cart_add_url: '/cart/add',
  cart_change_url: '/cart/change',
  cart_update_url: '/cart/update',
  search_url: '/search',
  predictive_search_url: '/search/suggest',
  account_url: '/account',
  account_login_url: '/account/login',
  account_register_url: '/account/register'
};

const pages = {
  about: {
    title: 'Our studio',
    handle: 'about',
    url: '/pages/about',
    content:
      '<p>Bloom Arts is a two-person studio working in concrete, clay and resin. Everything is cast, thrown or poured in small batches, which is why colour and texture shift a little between pieces.</p><h2>How we work</h2><p>We mix in small volumes so we can keep the pigment consistent within a batch. Concrete is cured for seven days before sealing. Stoneware is fired twice. Resin is poured in layers over three days.</p><p>If you need a piece matched to something you already own, send us a photo through the personalisation form and we will tell you honestly whether we can get close.</p>'
  }
};

export default {
  products,
  byHandle,
  collections,
  cart,
  linklists,
  shop,
  routes,
  pages
};
