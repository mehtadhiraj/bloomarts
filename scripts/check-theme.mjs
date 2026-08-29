/* ==========================================================================
   Theme integrity check.

   Catches the class of mistake Shopify only surfaces at runtime: a
   stylesheet_tag pointing at a file that was renamed, a {% render %} of a
   snippet that does not exist, a template referencing a missing section, or
   invalid JSON in a schema.

   Run: node scripts/check-theme.mjs
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const note = (file, msg) => problems.push(`${file}: ${msg}`);

const read = (p) => fs.readFileSync(p, 'utf8');
const listFiles = (dir, ext) =>
  fs.existsSync(path.join(root, dir))
    ? fs.readdirSync(path.join(root, dir)).filter((f) => f.endsWith(ext))
    : [];

const assets = new Set(listFiles('assets', ''));
const snippets = new Set(listFiles('snippets', '.liquid').map((f) => f.replace('.liquid', '')));
const sections = new Set(listFiles('sections', '.liquid').map((f) => f.replace('.liquid', '')));

/* Assets referenced by the theme but intentionally not committed. Empty
   now that Great Vibes ships with the theme; kept as the hook for any
   future merchant-supplied file. */
const SHOPIFY_PROVIDED = new Set();

const liquidFiles = [
  ...listFiles('layout', '.liquid').map((f) => `layout/${f}`),
  ...listFiles('sections', '.liquid').map((f) => `sections/${f}`),
  ...listFiles('snippets', '.liquid').map((f) => `snippets/${f}`),
  ...listFiles('templates', '.liquid').map((f) => `templates/${f}`),
  ...(fs.existsSync(path.join(root, 'templates/customers'))
    ? fs.readdirSync(path.join(root, 'templates/customers')).filter((f) => f.endsWith('.liquid')).map((f) => `templates/customers/${f}`)
    : [])
];

for (const rel of liquidFiles) {
  const src = read(path.join(root, rel));

  // asset_url references
  for (const m of src.matchAll(/'([^']+\.(?:css|js|woff2?|svg|png|jpg))'\s*\|\s*asset_url/g)) {
    if (!assets.has(m[1]) && !SHOPIFY_PROVIDED.has(m[1])) note(rel, `asset not found: ${m[1]}`);
  }

  // {% render 'name' %}
  for (const m of src.matchAll(/\{%-?\s*render\s+'([^']+)'/g)) {
    if (!snippets.has(m[1])) note(rel, `snippet not found: ${m[1]}`);
  }

  // {% section 'name' %}
  for (const m of src.matchAll(/\{%-?\s*section\s+'([^']+)'/g)) {
    if (!sections.has(m[1])) note(rel, `section not found: ${m[1]}`);
  }

  // Schema must be valid JSON
  const schema = src.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
  if (schema) {
    try {
      JSON.parse(schema[1]);
    } catch (error) {
      note(rel, `invalid schema JSON — ${error.message}`);
    }
  }

  // Operators Shopify Liquid does not implement
  if (/\bstartswith\b|\bendswith\b/.test(src)) {
    note(rel, 'uses startswith/endswith, which are not Shopify Liquid operators');
  }
}

/* JSON templates */
for (const f of listFiles('templates', '.json')) {
  const rel = `templates/${f}`;
  let json;
  try {
    json = JSON.parse(read(path.join(root, rel)));
  } catch (error) {
    note(rel, `invalid JSON — ${error.message}`);
    continue;
  }
  for (const [key, cfg] of Object.entries(json.sections || {})) {
    if (!cfg.type) note(rel, `section "${key}" has no type`);
    else if (!sections.has(cfg.type)) note(rel, `section not found: ${cfg.type}`);
  }
  for (const key of json.order || []) {
    if (!(json.sections || {})[key]) note(rel, `order references missing section "${key}"`);
  }
}

/* Config */
for (const f of ['config/settings_schema.json', 'config/settings_data.json']) {
  try {
    JSON.parse(read(path.join(root, f)));
  } catch (error) {
    note(f, `invalid JSON — ${error.message}`);
  }
}

/* Locales */
for (const f of listFiles('locales', '.json')) {
  try {
    JSON.parse(read(path.join(root, `locales/${f}`)));
  } catch (error) {
    note(`locales/${f}`, `invalid JSON — ${error.message}`);
  }
}

/* Required files */
for (const f of ['layout/theme.liquid', 'config/settings_schema.json', 'locales/en.default.json']) {
  if (!fs.existsSync(path.join(root, f))) note(f, 'required file is missing');
}

/* CSS brace balance and stray non-ASCII inside declarations */
for (const f of listFiles('assets', '.css')) {
  const src = read(path.join(root, `assets/${f}`));
  const open = (src.match(/{/g) || []).length;
  const close = (src.match(/}/g) || []).length;
  if (open !== close) note(`assets/${f}`, `unbalanced braces (${open} open, ${close} close)`);

  // Block comments are stripped across the whole file first. Splitting each
  // line on "/*" misses continuation lines inside a multi-line comment, which
  // flagged every em-dash in the prose as a bad declaration.
  const stripped = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  stripped.split('\n').forEach((line, i) => {
    // Non-ASCII inside a declaration is almost always a homoglyph that
    // silently invalidates the value (a Cyrillic "a" in a hex code, say).
    if (/:/.test(line) && /[^\x00-\x7F]/.test(line)) {
      note(`assets/${f}`, `non-ASCII character in declaration on line ${i + 1}: ${line.trim().slice(0, 60)}`);
    }
  });
}

if (problems.length === 0) {
  console.log(`\n  Theme check passed — ${liquidFiles.length} Liquid files, ${assets.size} assets, ${sections.size} sections, ${snippets.size} snippets.\n`);
} else {
  console.error(`\n  ${problems.length} problem(s):\n`);
  problems.forEach((p) => console.error(`   - ${p}`));
  console.error('');
  process.exitCode = 1;
}
