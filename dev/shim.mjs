/* ==========================================================================
   Shopify shims for LiquidJS.

   Implements the slice of the Shopify Liquid surface this theme actually
   uses. It is deliberately NOT a Shopify emulator — its only job is to
   render the real theme templates faithfully enough that layout, touch
   targets, contrast and reflow can be measured at real viewport widths.

   Where behaviour is approximated rather than reproduced, the comment says
   so, and the validation report repeats the caveat.
   ========================================================================== */

import { Liquid } from 'liquidjs';
import path from 'node:path';
import fs from 'node:fs';

/* --------------------------------------------------------------------------
   Dialect differences between Shopify Liquid and LiquidJS
   -------------------------------------------------------------------------- */

export function preprocess(source) {
  return (
    source
      // {% schema %} is metadata for the theme editor, not output. It is
      // parsed separately (see readSchema) and stripped before rendering.
      .replace(/\{%-?\s*schema\s*-?%\}[\s\S]*?\{%-?\s*endschema\s*-?%\}/g, '')
      // Shopify allows a trailing ? in identifiers (form.posted_successfully?);
      // LiquidJS does not. The shipped theme keeps Shopify syntax.
      .replace(/([A-Za-z_][\w.]*)\?/g, '$1')
  );
}

export function readSchema(source) {
  const match = source.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    throw new Error(`Invalid schema JSON: ${error.message}`);
  }
}

/* Defaults declared in a section's schema, so statically rendered sections
   (header, footer) behave as they would on a fresh install. */
export function schemaDefaults(schema) {
  const settings = {};
  if (!schema || !Array.isArray(schema.settings)) return settings;
  for (const setting of schema.settings) {
    if (setting.id === undefined) continue;
    settings[setting.id] = setting.default !== undefined ? setting.default : '';
  }
  return settings;
}

/* --------------------------------------------------------------------------
   Money
   -------------------------------------------------------------------------- */

function groupIndian(integerPart) {
  // 12,34,567 rather than 1,234,567 — the store prices in rupees.
  const last3 = integerPart.slice(-3);
  const rest = integerPart.slice(0, -3);
  if (!rest) return last3;
  return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}`;
}

function formatMoney(cents, format) {
  const amount = Number(cents || 0) / 100;
  const [whole, decimals] = amount.toFixed(2).split('.');
  const withSeparators = `${groupIndian(whole)}.${decimals}`;
  const noDecimals = groupIndian(whole);

  return String(format)
    .replace(/\{\{\s*amount_no_decimals\s*\}\}/g, noDecimals)
    .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/g, withSeparators)
    .replace(/\{\{\s*amount\s*\}\}/g, withSeparators);
}

/* --------------------------------------------------------------------------
   Translation
   -------------------------------------------------------------------------- */

function lookup(locale, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), locale);
}

function translate(locale, key, options) {
  let entry = lookup(locale, key);
  if (entry === undefined) return `translation missing: ${key}`;

  // Pluralised entries are objects keyed one/other.
  if (entry && typeof entry === 'object') {
    const count = Number(options.count);
    entry = count === 1 ? entry.one : entry.other;
    if (entry === undefined) return `translation missing: ${key}`;
  }

  return String(entry).replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name) =>
    options[name] !== undefined ? String(options[name]) : match
  );
}

/* Named filter arguments arrive from LiquidJS as [key, value] pairs. */
function namedArgs(args) {
  const options = {};
  for (const arg of args) {
    if (Array.isArray(arg) && arg.length === 2) options[arg[0]] = arg[1];
  }
  return options;
}

/* --------------------------------------------------------------------------
   Engine
   -------------------------------------------------------------------------- */

/* LiquidJS reads partials through this interface. Its fs object is frozen
   after construction, so the preprocessor is installed here rather than
   patched on afterwards. */
const preprocessingFS = {
  existsSync: (file) => fs.existsSync(file),
  exists: async (file) => fs.existsSync(file),
  readFileSync: (file) => preprocess(fs.readFileSync(file, "utf8")),
  readFile: async (file) => preprocess(await fs.promises.readFile(file, "utf8")),
  resolve: (dir, file, ext) => {
    let resolved = path.resolve(dir, file);
    if (ext && !path.extname(resolved)) resolved += ext;
    return resolved;
  },
  dirname: (file) => path.dirname(file),
  sep: path.sep,
  contains: (root, file) => path.resolve(file).startsWith(path.resolve(root))
};

export function createEngine({ themeRoot, locale, globals, renderSection }) {
  const engine = new Liquid({
    root: [path.join(themeRoot, 'snippets'), path.join(themeRoot, 'sections'), themeRoot],
    extname: '.liquid',
    globals,
    // Shopify treats empty string and 0 as truthy in {% if %}; LiquidJS
    // matches that by default, so jsTruthy stays off.
    jsTruthy: false,
    strictFilters: false,
    strictVariables: false,
    // Every partial goes through the same preprocessor as top-level
    // templates, so a {% schema %} inside a section reached via
    // {% section %} never gets to the parser.
    fs: preprocessingFS
  });


  /* ---- URL and tag filters ---- */

  engine.registerFilter('asset_url', (value) => `/assets/${value}`);
  engine.registerFilter('asset_img_url', (value) => `/assets/${value}`);
  engine.registerFilter('file_url', (value) => `/files/${value}`);
  engine.registerFilter('shopify_asset_url', (value) => `/shopify/${value}`);

  engine.registerFilter('stylesheet_tag', (url) => `<link rel="stylesheet" href="${url}">`);
  engine.registerFilter('script_tag', (url) => `<script src="${url}"></script>`);

  engine.registerFilter('link_to', (text, url, title) =>
    `<a href="${url}"${title ? ` title="${title}"` : ''}>${text}</a>`
  );
  engine.registerFilter('within', (url) => url);

  /* ---- Images ----
     Returns a path to a generated placeholder plus the requested transform
     as query parameters, so srcset candidates stay distinguishable in the
     network panel and in assertions. */
  function imageUrl(image, ...args) {
    if (!image) return '';
    const options = namedArgs(args);
    const src = typeof image === 'string' ? image : image.src || '';
    const params = new URLSearchParams();
    if (options.width) params.set('width', options.width);
    if (options.height) params.set('height', options.height);
    if (options.crop) params.set('crop', options.crop);
    const query = params.toString();
    return query ? `${src}?${query}` : src;
  }

  engine.registerFilter('image_url', imageUrl);
  engine.registerFilter('img_url', imageUrl);

  engine.registerFilter('image_tag', (src, ...args) => {
    const options = namedArgs(args);
    const attrs = Object.entries(options)
      .map(([key, value]) => `${key.replace(/_/g, '-')}="${value}"`)
      .join(' ');
    return `<img src="${src}" ${attrs}>`;
  });

  engine.registerFilter('placeholder_svg_tag', (name, className = '') =>
    `<svg class="${className}" role="img" aria-hidden="true" viewBox="0 0 100 100" width="100" height="100"><rect width="100%" height="100%" fill="currentColor" opacity="0.08"/></svg>`
  );

  engine.registerFilter('payment_type_svg_tag', (type, ...args) => {
    const options = namedArgs(args);
    const className = options.class || '';
    return `<svg class="${className}" role="img" aria-label="${type}" viewBox="0 0 38 24" width="38" height="24"><rect width="38" height="24" rx="3" fill="currentColor" opacity="0.12"/></svg>`;
  });

  /* ---- Money ---- */

  const moneyFormat = (globals.shop && globals.shop.money_format) || '₹{{amount}}';
  const moneyCurrencyFormat =
    (globals.shop && globals.shop.money_with_currency_format) || '₹{{amount}} INR';

  engine.registerFilter('money', (cents) => formatMoney(cents, moneyFormat));
  engine.registerFilter('money_with_currency', (cents) => formatMoney(cents, moneyCurrencyFormat));
  engine.registerFilter('money_without_currency', (cents) => formatMoney(cents, '{{amount}}'));
  engine.registerFilter('money_without_trailing_zeros', (cents) =>
    formatMoney(cents, '₹{{amount_no_decimals}}')
  );

  /* ---- Translation ---- */

  engine.registerFilter('t', (key, ...args) => translate(locale, String(key), namedArgs(args)));
  engine.registerFilter('translate', (key, ...args) => translate(locale, String(key), namedArgs(args)));

  /* ---- Strings and misc ---- */

  const handleize = (value) =>
    String(value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  engine.registerFilter('handle', handleize);
  engine.registerFilter('handleize', handleize);
  engine.registerFilter('json', (value) => JSON.stringify(value === undefined ? null : value));
  engine.registerFilter('pluralize', (count, singular, plural) => (Number(count) === 1 ? singular : plural));
  engine.registerFilter('weight_with_unit', (grams) => `${(Number(grams) / 1000).toFixed(2)} kg`);
  engine.registerFilter('highlight', (text, term) =>
    term ? String(text).replace(new RegExp(`(${term})`, 'gi'), '<mark>$1</mark>') : text
  );
  engine.registerFilter('camelize', (value) =>
    String(value).replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
  );

  /* Only the alpha modification is used (overlay colour); anything else
     passes through unchanged rather than pretending to be implemented. */
  engine.registerFilter('color_modify', (color, property, value) => {
    if (property !== 'alpha') return color;
    const hex = String(color).replace('#', '');
    if (hex.length !== 6) return color;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${value})`;
  });

  engine.registerFilter('color_lighten', (color) => color);
  engine.registerFilter('color_darken', (color) => color);

  /* Fonts are system-stacked in the harness — there is no Shopify font CDN
     to serve woff2 from. The shipped theme emits real @font-face rules. */
  engine.registerFilter('font_face', () => '<!-- font_face: real @font-face rules are emitted by Shopify -->');
  engine.registerFilter('font_modify', (font) => font);
  engine.registerFilter('font_url', () => '');

  /* --------------------------------------------------------------------
     Tags
     -------------------------------------------------------------------- */

  // {% section 'name' %}
  engine.registerTag('section', {
    parse(token) {
      this.sectionName = token.args.trim().replace(/^['"]|['"]$/g, '');
    },
    *render(ctx, emitter) {
      const html = yield renderSection(this.sectionName, ctx);
      emitter.write(html);
    }
  });

  // {% form 'type', object, class: 'x' %} … {% endform %}
  engine.registerTag('form', {
    parse(token, remainTokens) {
      this.args = token.args;
      this.templates = [];
      const stream = this.liquid.parser.parseStream(remainTokens);
      stream
        .on('template', (tpl) => this.templates.push(tpl))
        .on('tag:endform', () => stream.stop())
        .on('end', () => {
          throw new Error('{% form %} is missing {% endform %}');
        });
      stream.start();
    },
    *render(ctx, emitter) {
      // Argument values may be quoted literals OR Liquid expressions
      // (id: form_id). Matching only literals silently produced a form id
      // that did not match what the sticky bar targets with form="".
      const attr = function* (name) {
        const match = this.args.match(new RegExp(`\\b${name}:\\s*([^,]+?)(?=,|$)`));
        if (!match) return null;
        const raw = match[1].trim();
        const quoted = raw.match(/^'([^']*)'$|^"([^"]*)"$/);
        if (quoted) return quoted[1] !== undefined ? quoted[1] : quoted[2];
        return yield this.liquid.evalValue(raw, ctx);
      }.bind(this);

      const typeMatch = this.args.match(/^\s*(?:'([^']*)'|"([^"]*)")/);
      const formType = typeMatch ? typeMatch[1] || typeMatch[2] : 'form';
      const className = yield* attr('class');
      const formId = (yield* attr('id')) || `${formType}-form`;

      // Shopify emits the product form as multipart so a line item property
      // can carry an uploaded file. Reproduced here because the upload
      // control depends on it.
      const action = formType === 'product' ? '/cart/add' : `/contact#${formType}-form`;

      emitter.write(
        `<form method="post" action="${action}" id="${formId}" accept-charset="UTF-8"` +
          ` enctype="multipart/form-data"${className ? ` class="${className}"` : ''}` +
          `${/novalidate/.test(this.args) ? ' novalidate' : ''}>`
      );

      ctx.push({
        form: {
          posted_successfully: false,
          errors: null,
          id: `${formType}-form`
        }
      });
      yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
      ctx.pop();

      emitter.write('</form>');
    }
  });

  // {% paginate collection.products by 12 %} … {% endpaginate %}
  engine.registerTag('paginate', {
    parse(token, remainTokens) {
      const match = token.args.match(/^(.+?)\s+by\s+(\d+)/);
      this.collectionExpr = match ? match[1].trim() : token.args.trim();
      this.pageSize = match ? Number(match[2]) : 20;
      this.templates = [];
      const stream = this.liquid.parser.parseStream(remainTokens);
      stream
        .on('template', (tpl) => this.templates.push(tpl))
        .on('tag:endpaginate', () => stream.stop())
        .on('end', () => {
          throw new Error('{% paginate %} is missing {% endpaginate %}');
        });
      stream.start();
    },
    *render(ctx, emitter) {
      const items = (yield this.liquid.evalValue(this.collectionExpr, ctx)) || [];
      const total = Array.isArray(items) ? items.length : 0;
      const pages = Math.max(1, Math.ceil(total / this.pageSize));

      // The harness always renders page 1; pagination controls are still
      // emitted so their touch targets can be measured.
      ctx.push({
        paginate: {
          items: total,
          page_size: this.pageSize,
          current_page: 1,
          pages,
          current_offset: 0,
          parts: Array.from({ length: Math.min(pages, 5) }, (_, i) => ({
            title: String(i + 1),
            url: `?page=${i + 1}`,
            is_link: i !== 0
          })),
          previous: null,
          next: pages > 1 ? { title: 'Next', url: '?page=2', is_link: true } : null
        }
      });
      yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
      ctx.pop();
    }
  });

  // {% style %} … {% endstyle %}
  engine.registerTag('style', {
    parse(token, remainTokens) {
      this.templates = [];
      const stream = this.liquid.parser.parseStream(remainTokens);
      stream
        .on('template', (tpl) => this.templates.push(tpl))
        .on('tag:endstyle', () => stream.stop())
        .on('end', () => {
          throw new Error('{% style %} is missing {% endstyle %}');
        });
      stream.start();
    },
    *render(ctx, emitter) {
      emitter.write('<style>');
      yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
      emitter.write('</style>');
    }
  });

  return engine;
}

export { formatMoney, translate };
