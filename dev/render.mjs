/* ==========================================================================
   Renders the real theme Liquid to static HTML for local validation.

   Run: npm run render
   Output: dev/dist/
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEngine, preprocess, readSchema, schemaDefaults } from './shim.mjs';
import data from './data/index.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const themeRoot = path.join(here, '..');
const distRoot = path.join(here, 'dist');


/* Shopify writes a "contents are auto-generated" banner comment at the top of
   every JSON file it syncs back from the theme editor. That is not valid JSON
   by the spec, but Shopify both emits and accepts it, so anything reading
   these files has to tolerate it too. */
function parseThemeJson(text) {
  return JSON.parse(String(text).replace(/^\uFEFF?\s*\/\*[\s\S]*?\*\//, ''));
}

const locale = parseThemeJson(fs.readFileSync(path.join(themeRoot, 'locales/en.default.json'), 'utf8'));
const settingsData = parseThemeJson(fs.readFileSync(path.join(themeRoot, 'config/settings_data.json'), 'utf8'));

/* Font settings are objects in Liquid (family, fallback_families, weight),
   not the "assistant_n4" handle stored in settings_data. */
function fontObject(handle) {
  const [family] = String(handle || 'assistant_n4').split('_');
  const name = family.charAt(0).toUpperCase() + family.slice(1);
  return {
    family: name,
    fallback_families: 'ui-sans-serif, system-ui, sans-serif',
    weight: 400,
    style: 'normal',
    baseline_ratio: 0.75
  };
}

const settings = {
  ...settingsData.current,
  font_body: fontObject(settingsData.current.font_body),
  font_heading: fontObject(settingsData.current.font_heading),
  favicon: null,
  share_image: null
};

/* --------------------------------------------------------------------------
   Sections rendered by the layout rather than by a template
   -------------------------------------------------------------------------- */

const staticSections = {
  'announcement-bar': {
    blocks: [
      {
        type: 'announcement',
        settings: {
          text: '♥ Little Creations, Big Smiles — free shipping over ₹2,500',
          link: '/collections/all'
        }
      }
    ]
  },
  header: {
    settings: {
      logo: null,
      menu: 'main-menu',
      sticky: true,
      show_search: true
    }
  },
  footer: {
    settings: {
      show_newsletter: true,
      newsletter_heading: 'New pieces, first',
      newsletter_text: 'Small-batch drops sell out fast. Hear about them before they go live.',
      show_payment_icons: true
    },
    blocks: [
      { type: 'menu', settings: { heading: 'Shop', menu: 'footer-shop' } },
      { type: 'menu', settings: { heading: 'Help', menu: 'footer-help' } },
      {
        type: 'text',
        settings: {
          heading: 'Our studio',
          text: '<p>Bloom Arts is a two-person studio working in concrete, clay and resin. Everything is cast, thrown or poured in small batches.</p>'
        }
      }
    ]
  },
  'cart-drawer': {}
};

/* --------------------------------------------------------------------------
   Section rendering
   -------------------------------------------------------------------------- */

let currentScope = {};

function blockSchema(schema, type) {
  if (!schema || !Array.isArray(schema.blocks)) return [];
  const definition = schema.blocks.find((b) => b.type === type);
  return definition && Array.isArray(definition.settings) ? definition.settings : [];
}

function blockDefaults(schema, type) {
  const definition = schema && Array.isArray(schema.blocks)
    ? schema.blocks.find((b) => b.type === type)
    : null;
  return schemaDefaults(definition);
}

/* The shipped JSON templates leave image_picker settings empty, because a
   real store picks its own images. The harness fills any empty one with a
   generated placeholder so image-driven sections are laid out with real
   intrinsic dimensions rather than collapsing to the fallback SVG. */
function mockImage(seed, wide) {
  const palette = ["#8d8880", "#b9a58c", "#6f93a0", "#a3785f", "#b0aaa1", "#c98f9c", "#7a7f9c", "#b6704f"];
  const tint = palette[seed % palette.length];
  const width = wide ? 2400 : 1600;
  const height = wide ? 1200 : 1600;
  return {
    id: `mock-${seed}`,
    alt: "",
    src: `/img/mock-${seed}${wide ? "-wide" : ""}.svg`,
    width,
    height,
    aspect_ratio: width / height,
    tint
  };
}

let mockSeed = 0;

/* Every fill is recorded. The fill is what makes the harness useful, but it
   is also a lie the store will not tell: on Shopify an unset image_picker
   renders the grey placeholder SVG, and we have already shipped a section
   that looked complete here and was six empty squares in production. The
   notice at the end of a build is the reminder of what still needs picking
   in the theme editor. */
const filledImages = [];

/* BLOOM_BARE=1 renders what a freshly installed theme looks like before any
   image has been picked. Worth running before every push: it is the view the
   store actually serves on day one. */
const bare = process.env.BLOOM_BARE === '1';

function fillImageSettings(schemaSettings, values, context) {
  if (bare || !Array.isArray(schemaSettings)) return values;
  for (const setting of schemaSettings) {
    if (setting.type !== "image_picker") continue;
    if (values[setting.id]) continue;
    const wide = /desktop|banner|wide/.test(setting.id);
    values[setting.id] = mockImage(mockSeed++, wide);
    if (context) filledImages.push(`${context}.${setting.id}`);
  }
  return values;
}

function reportFilledImages() {
  if (!filledImages.length) return;
  const counts = new Map();
  filledImages.forEach((entry) => counts.set(entry, (counts.get(entry) || 0) + 1));
  console.log(`\n  note  ${filledImages.length} image settings are empty in the theme and were`);
  console.log('        filled with placeholders here. On the store they render as grey');
  console.log('        boxes until someone picks an image in the theme editor:');
  [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([entry, count]) => {
      console.log(`         - ${entry}${count > 1 ? ` (\u00d7${count})` : ''}`);
    });
}

function readSection(name) {
  const file = path.join(themeRoot, 'sections', `${name}.liquid`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf8');
  return { raw, source: preprocess(raw), schema: readSchema(raw) };
}

async function renderSection(name, config = {}, index = 1) {
  const section = readSection(name);
  if (!section) {
    // Missing sections are reported rather than silently skipped — a typo in
    // a template must not look like a rendering success.
    return `<!-- MISSING SECTION: ${name} -->`;
  }

  // OS 2.0 JSON templates key blocks by id and sequence them with
  // block_order; the static section definitions in this harness use a plain
  // array. Both shapes normalise to the ordered array Liquid expects.
  let blockList = [];
  if (Array.isArray(config.blocks)) {
    blockList = config.blocks.map((block, i) => [`${name}-block-${i}`, block]);
  } else if (config.blocks && typeof config.blocks === "object") {
    const order = config.block_order || config.order || Object.keys(config.blocks);
    blockList = order
      .filter((key) => config.blocks[key])
      .map((key) => [key, config.blocks[key]]);
  }

  const blocks = blockList.map(([id, block]) => ({
    id,
    type: block.type,
    settings: fillImageSettings(
      blockSchema(section.schema, block.type),
      { ...blockDefaults(section.schema, block.type), ...(block.settings || {}) },
      `${name}.blocks.${block.type}`
    ),
    shopify_attributes: `data-block="${id}"`
  }));

  const sectionObject = {
    id: `section-${name}`,
    type: name,
    settings: fillImageSettings(
      section.schema ? section.schema.settings : [],
      { ...schemaDefaults(section.schema), ...(config.settings || {}) },
      name
    ),
    blocks,
    index,
    index0: index - 1,
    location: 'template'
  };

  const rendered = await engine.parseAndRender(section.source, {
    ...currentScope,
    section: sectionObject
  });

  /* Shopify wraps every rendered section in a .shopify-section div. The
     harness did not, and that gap hid real bugs: a position:sticky element
     inside its wrapper cannot travel (the wrapper is only as tall as the
     section), and sibling selectors like `.header ~ main` never match once
     the header is wrapped. Both worked locally and failed on the store.

     Static sections are id'd by name; sections from a JSON template use
     Shopify's template--<id>__<key> form. */
  const wrapperId = config.templateKey
    ? `shopify-section-${config.templateId}__${config.templateKey}`
    : `shopify-section-${name}`;

  return `<div id="${wrapperId}" class="shopify-section">${rendered}</div>`;
}

/* Mutated in place between pages. On Shopify, page_title, product,
   collection and friends are global objects, so a {% render %}-ed snippet
   can read them; LiquidJS isolates local scope, so they must live here for
   snippets like meta-tags to resolve. */
const globals = {
  settings,
  shop: data.shop,
  routes: data.routes,
  linklists: data.linklists,
  collections: data.collections,
  all_products: data.byHandle,
  cart: data.cart,
  customer: null,
  powered_by_link: '<a href="https://www.shopify.com">Powered by Shopify</a>',
  content_for_header: '<!-- content_for_header: injected by Shopify -->',
  canonical_url: 'https://bloomarts.example/',
  request: { locale: { iso_code: 'en', direction: 'ltr' }, page_type: 'index', design_mode: false },
  current_page: 1,
  current_tags: null
};

const PAGE_KEYS = [
  'product',
  'collection',
  'page',
  'search',
  'blog',
  'article',
  'template',
  'page_title',
  'page_description',
  'canonical_url',
  'request'
];

function applyPageScope(scope) {
  for (const key of PAGE_KEYS) delete globals[key];
  Object.assign(globals, scope);
}

const engine = createEngine({
  themeRoot,
  locale,
  globals,
  renderSection: (name) => renderSection(name, staticSections[name] || {})
});

/* --------------------------------------------------------------------------
   Templates
   -------------------------------------------------------------------------- */

async function renderTemplate(templateName) {
  const jsonPath = path.join(themeRoot, 'templates', `${templateName}.json`);
  if (!fs.existsSync(jsonPath)) return null;

  const template = parseThemeJson(fs.readFileSync(jsonPath, 'utf8'));
  const order = template.order || Object.keys(template.sections || {});

  const parts = [];
  let index = 1;
  for (const key of order) {
    const config = template.sections[key];
    if (!config) continue;
    parts.push(
      await renderSection(
        config.type,
        { ...config, templateKey: key, templateId: `template--${templateName}` },
        index
      )
    );
    index += 1;
  }
  return parts.join('\n');
}

async function renderPage({ file, template, scope }) {
  currentScope = scope;
  applyPageScope(scope);

  const layoutSource = preprocess(
    fs.readFileSync(path.join(themeRoot, 'layout/theme.liquid'), 'utf8')
  );

  const contentForLayout = await renderTemplate(template);
  if (contentForLayout === null) {
    console.log(`  skip  ${file}  (templates/${template}.json not present yet)`);
    return false;
  }

  let html = await engine.parseAndRender(layoutSource, {
    ...scope,
    content_for_layout: contentForLayout
  });

  /* Harness only. On Shopify the font_face filter emits real @font-face
     rules from the store's font library; there is no such CDN here, so the
     same three families are pulled from Google Fonts purely so the local
     preview shows the actual type. This never reaches the theme. */
  html = html.replace(
    "</head>",
    '  <link rel="preconnect" href="https://fonts.googleapis.com">\n' +
      '    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
      '    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?' +
      'family=Lora:wght@400;500;600;700&family=Poppins:wght@400;500;600&family=Great+Vibes&display=swap">\n' +
      "  </head>"
  );

  const target = path.join(distRoot, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html);

  const missing = (html.match(/<!-- MISSING SECTION: ([\w-]+) -->/g) || []).map((m) =>
    m.replace(/<!-- MISSING SECTION: | -->/g, '')
  );
  console.log(
    `  ok    ${file}  (${(html.length / 1024).toFixed(1)} kB)` +
      (missing.length ? `  MISSING: ${missing.join(', ')}` : '')
  );
  return true;
}

/* --------------------------------------------------------------------------
   Placeholder imagery
   Generated once so intrinsic dimensions and aspect ratios are real.
   -------------------------------------------------------------------------- */

function mockImageFile(seed, wide) {
  const img = mockImage(seed, wide);
  return {
    src: img.src,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${img.width} ${img.height}" width="${img.width}" height="${img.height}">
  <rect width="100%" height="100%" fill="${img.tint}"/>
  <circle cx="${img.width * 0.62}" cy="${img.height * 0.44}" r="${Math.min(img.width, img.height) / 3.6}" fill="#ffffff" opacity="0.12"/>
  <rect x="0" y="${img.height - 6}" width="100%" height="6" fill="#000000" opacity="0.14"/>
</svg>`
  };
}

function writePlaceholderImages() {
  const dir = path.join(distRoot, 'img');
  fs.mkdirSync(dir, { recursive: true });

  const seen = new Set();
  for (const product of data.products) {
    for (const img of product.images) {
      const name = path.basename(img.src);
      if (seen.has(name)) continue;
      seen.add(name);

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${img.width} ${img.height}" width="${img.width}" height="${img.height}">
  <rect width="100%" height="100%" fill="${img.tint}"/>
  <circle cx="${img.width / 2}" cy="${img.height / 2}" r="${img.width / 3.4}" fill="#ffffff" opacity="0.10"/>
  <rect x="0" y="${img.height - 4}" width="100%" height="4" fill="#000000" opacity="0.12"/>
</svg>`;
      fs.writeFileSync(path.join(dir, name), svg);
    }
  }
  // Mock images used to fill empty image_picker settings.
  for (let i = 0; i < 24; i += 1) {
    for (const wide of [false, true]) {
      const img = mockImageFile(i, wide);
      fs.writeFileSync(path.join(dir, path.basename(img.src)), img.svg);
      seen.add(path.basename(img.src));
    }
  }

  console.log(`  ok    img/  (${seen.size} placeholders)`);
}

/* The viewport harness page itself. Copied rather than rendered — it is a
   testing tool, not part of the theme. */
function copyHarnessPages() {
  fs.copyFileSync(path.join(here, "viewport.html"), path.join(distRoot, "viewport.html"));
  console.log("  ok    viewport.html");
}

function copyAssets() {
  const source = path.join(themeRoot, 'assets');
  const target = path.join(distRoot, 'assets');
  fs.mkdirSync(target, { recursive: true });
  for (const file of fs.readdirSync(source)) {
    fs.copyFileSync(path.join(source, file), path.join(target, file));
  }
  console.log(`  ok    assets/  (${fs.readdirSync(source).length} files)`);
}

/* --------------------------------------------------------------------------
   Build
   -------------------------------------------------------------------------- */

const baseScope = {
  request: { locale: { iso_code: 'en', direction: 'ltr' }, page_type: 'index', design_mode: false },
  canonical_url: 'https://bloomarts.example/',
  page_description: data.shop.description
};

const pages = [
  {
    file: 'index.html',
    template: 'index',
    scope: { ...baseScope, template: { name: 'index' }, page_title: 'Bloom Arts' }
  },
  {
    file: 'product.html',
    template: 'product',
    scope: {
      ...baseScope,
      template: { name: 'product' },
      request: { ...baseScope.request, page_type: 'product' },
      page_title: data.byHandle['strata-resin-tray'].title,
      product: data.byHandle['strata-resin-tray']
    }
  },
  {
    file: 'product-simple.html',
    template: 'product',
    scope: {
      ...baseScope,
      template: { name: 'product' },
      request: { ...baseScope.request, page_type: 'product' },
      page_title: data.byHandle['speckle-stoneware-mug'].title,
      product: data.byHandle['speckle-stoneware-mug']
    }
  },
  {
    file: 'collection.html',
    template: 'collection',
    scope: {
      ...baseScope,
      template: { name: 'collection' },
      request: { ...baseScope.request, page_type: 'collection' },
      page_title: data.collections.concrete.title,
      collection: data.collections.concrete
    }
  },
  {
    file: 'cart.html',
    template: 'cart',
    scope: { ...baseScope, template: { name: 'cart' }, page_title: 'Cart' }
  },
  {
    file: 'search.html',
    template: 'search',
    scope: {
      ...baseScope,
      template: { name: 'search' },
      request: { ...baseScope.request, page_type: 'search' },
      page_title: 'Search',
      search: {
        performed: true,
        terms: 'concrete',
        results_count: 5,
        results: data.collections.concrete.products
      }
    }
  },
  {
    file: 'page.html',
    template: 'page',
    scope: {
      ...baseScope,
      template: { name: 'page' },
      request: { ...baseScope.request, page_type: 'page' },
      page_title: data.pages.about.title,
      page: data.pages.about
    }
  },
  {
    file: '404.html',
    template: '404',
    scope: { ...baseScope, template: { name: '404' }, page_title: 'Page not found' }
  }
];

/* Output assertions.

   Catches Shopify-shaped mistakes that only surface on a real store. The
   first one here is not hypothetical: font_face returns raw CSS text, and
   emitting it outside a <style> block made the entire @font-face declaration
   render as visible text at the top of every page on the live store. */
function auditOutput() {
  const problems = [];

  for (const file of fs.readdirSync(distRoot).filter((f) => f.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(distRoot, file), 'utf8');

    const styleRanges = [...html.matchAll(/<style[^>]*>[\s\S]*?<\/style>/g)].map((m) => [
      m.index,
      m.index + m[0].length
    ]);

    for (const m of html.matchAll(/@font-face/g)) {
      const inside = styleRanges.some(([a, b]) => m.index >= a && m.index <= b);
      if (!inside) {
        problems.push(`${file}: @font-face outside a <style> block — it will render as visible text`);
        break;
      }
    }

    // Liquid that failed to render leaves its delimiters behind.
    if (/\{%[^}]*%\}/.test(html)) {
      problems.push(`${file}: unrendered Liquid tag in output`);
    }
    if (html.includes('translation missing')) {
      problems.push(`${file}: missing translation string`);
    }
  }

  if (problems.length === 0) {
    console.log('  ok    output audit');
    return;
  }

  console.error('\n  Output audit failed:');
  problems.forEach((p) => console.error(`   - ${p}`));
  process.exitCode = 1;
}

async function build() {
  console.log('\nBloomarts — rendering theme to dev/dist\n');
  fs.mkdirSync(distRoot, { recursive: true });

  copyAssets();
  copyHarnessPages();
  writePlaceholderImages();

  let rendered = 0;
  for (const page of pages) {
    try {
      if (await renderPage(page)) rendered += 1;
    } catch (error) {
      console.error(`  FAIL  ${page.file}\n        ${error.message}`);
      process.exitCode = 1;
    }
  }

  auditOutput();
  reportFilledImages();

  console.log(`\n${rendered}/${pages.length} pages rendered\n`);
}

build();
