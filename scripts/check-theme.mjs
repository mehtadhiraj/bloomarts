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

/* Settings declared in a schema but never read.

   A setting nothing renders is a control that silently does nothing in the
   theme editor — the merchant changes it and nothing happens.

   Snippets are followed one level deep, because sections routinely pass a
   whole block into a snippet ({% render 'customization-field', block: block %})
   and read its settings there. Without that, every such setting looks dead. */
for (const rel of liquidFiles.filter((f) => f.startsWith('sections/'))) {
  const src = read(path.join(root, rel));
  const schema = src.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
  if (!schema) continue;

  let parsed;
  try {
    parsed = JSON.parse(schema[1]);
  } catch {
    continue; // already reported above
  }

  // The section body plus every snippet it renders.
  let body = src.slice(0, schema.index);
  for (const m of body.matchAll(/\{%-?\s*render\s+'([^']+)'/g)) {
    const snippet = path.join(root, 'snippets', `${m[1]}.liquid`);
    if (fs.existsSync(snippet)) body += read(snippet);
  }

  const declared = [
    ...(parsed.settings || []).map((x) => [x.id, 'settings']),
    ...(parsed.blocks || []).flatMap((b) => (b.settings || []).map((x) => [x.id, `block ${b.type}`]))
  ];

  for (const [id, where] of declared) {
    if (!id) continue;
    if (!body.includes(`settings.${id}`)) {
      note(rel, `${where} setting "${id}" is declared but never rendered`);
    }
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

/* JSON templates validated against their section schemas.

   Shopify rejects a JSON template that sets a setting the section's schema
   does not declare — and rejecting it means the template does not exist at
   all. A stale `eyebrow` key left in index.json after the setting was removed
   from the schema took the entire homepage off the store: every other route
   worked, and `/` returned 404 because there was no index template. */
function sectionSchema(type) {
  const file = path.join(root, 'sections', `${type}.liquid`);
  if (!fs.existsSync(file)) return null;
  const m = read(file).match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

for (const f of listFiles('templates', '.json')) {
  const rel = `templates/${f}`;
  let json;
  try {
    json = JSON.parse(read(path.join(root, rel)));
  } catch {
    continue; // reported above
  }

  for (const [key, cfg] of Object.entries(json.sections || {})) {
    const schema = sectionSchema(cfg.type);
    if (!schema) continue;

    const settingIds = new Set((schema.settings || []).map((x) => x.id));
    for (const id of Object.keys(cfg.settings || {})) {
      if (!settingIds.has(id)) {
        note(rel, `section "${key}" (${cfg.type}) sets "${id}", which its schema does not declare — Shopify will reject this template`);
      }
    }

    // A select must be given one of its own option values.
    for (const setting of schema.settings || []) {
      if (setting.type !== 'select') continue;
      const value = (cfg.settings || {})[setting.id];
      if (value === undefined) continue;
      const allowed = (setting.options || []).map((o) => o.value);
      if (!allowed.includes(value)) {
        note(rel, `section "${key}" (${cfg.type}) sets ${setting.id}="${value}", not one of: ${allowed.join(', ')}`);
      }
    }

    const blockTypes = new Set((schema.blocks || []).map((b) => b.type));
    for (const [blockKey, block] of Object.entries(cfg.blocks || {})) {
      if (!blockTypes.has(block.type)) {
        note(rel, `section "${key}" block "${blockKey}" has type "${block.type}", which the schema does not declare`);
        continue;
      }
      const def = (schema.blocks || []).find((b) => b.type === block.type);
      const blockIds = new Set((def.settings || []).map((x) => x.id));
      for (const id of Object.keys(block.settings || {})) {
        if (!blockIds.has(id)) {
          note(rel, `section "${key}" block "${blockKey}" sets "${id}", which its schema does not declare`);
        }
      }
    }

    if (schema.max_blocks && Object.keys(cfg.blocks || {}).length > schema.max_blocks) {
      note(rel, `section "${key}" has more blocks than max_blocks (${schema.max_blocks})`);
    }
  }
}

/* Shopify schema limits. Exceeding one of these does not raise an error —
   Shopify silently drops the section or block from the theme editor and from
   any JSON template using it. */
for (const rel of liquidFiles.filter((f) => f.startsWith('sections/'))) {
  const schema = sectionSchema(path.basename(rel, '.liquid'));
  if (!schema) continue;

  if (schema.name && schema.name.length > 25) {
    note(rel, `section name "${schema.name}" is ${schema.name.length} characters (Shopify's limit is 25)`);
  }

  const seen = new Set();
  for (const setting of schema.settings || []) {
    if (!setting.type) note(rel, 'a setting has no type');
    if (setting.id) {
      if (seen.has(setting.id)) note(rel, `duplicate setting id "${setting.id}"`);
      seen.add(setting.id);
    }
    if (setting.type === 'select') {
      const values = (setting.options || []).map((o) => o.value);
      if (values.length === 0) note(rel, `select "${setting.id}" has no options`);
      if (setting.default !== undefined && !values.includes(setting.default)) {
        note(rel, `select "${setting.id}" default "${setting.default}" is not one of its options`);
      }
    }
    if (setting.type === 'range') {
      const steps = (setting.max - setting.min) / setting.step + 1;
      if (steps > 101) note(rel, `range "${setting.id}" has ${Math.round(steps)} steps (Shopify's limit is 101)`);
      if (setting.default === undefined) note(rel, `range "${setting.id}" has no default (Shopify requires one)`);
    }
  }

  for (const block of schema.blocks || []) {
    if (block.type !== '@app' && !block.name) note(rel, `block "${block.type}" has no name`);
    if (block.name && block.name.length > 25) {
      note(rel, `block name "${block.name}" is ${block.name.length} characters (Shopify's limit is 25) — the block is silently dropped`);
    }
    const blockSeen = new Set();
    for (const setting of block.settings || []) {
      if (setting.id) {
        if (blockSeen.has(setting.id)) note(rel, `block ${block.type}: duplicate setting id "${setting.id}"`);
        blockSeen.add(setting.id);
      }
      if (setting.type === 'range' && setting.default === undefined) {
        note(rel, `block ${block.type}: range "${setting.id}" has no default`);
      }
    }
  }
}

/* JSON template conventions Shopify expects, taken from Dawn.

   Both of these are silent failures: Shopify does not render an error, the
   template simply does not exist, and every route works except the one that
   template serves. */
for (const f of listFiles('templates', '.json')) {
  const rel = `templates/${f}`;
  let json;
  try {
    json = JSON.parse(read(path.join(root, rel)));
  } catch {
    continue;
  }

  for (const [key, cfg] of Object.entries(json.sections || {})) {
    // Dawn uses lowercase + underscores for section IDs. Hyphens in a key
    // (as opposed to in a section TYPE, where they are correct) are not safe.
    if (!/^[a-z0-9_]+$/.test(key)) {
      note(rel, `section id "${key}" should be lowercase letters, numbers and underscores only — hyphens belong in the section type, not the id`);
    }

    const schema = sectionSchema(cfg.type);
    if (!schema) continue;

    const urlSettings = new Set(
      (schema.settings || []).filter((x) => x.type === 'url').map((x) => x.id)
    );
    for (const [id, value] of Object.entries(cfg.settings || {})) {
      if (!urlSettings.has(id) || !value) continue;
      if (!String(value).startsWith('shopify://')) {
        note(rel, `section "${key}" setting "${id}" = "${value}" — url settings use the shopify:// scheme (e.g. shopify://collections/all), not a raw path`);
      }
    }

    for (const [blockKey, block] of Object.entries(cfg.blocks || {})) {
      const def = (schema.blocks || []).find((b) => b.type === block.type);
      if (!def) continue;
      const blockUrls = new Set((def.settings || []).filter((x) => x.type === 'url').map((x) => x.id));
      for (const [id, value] of Object.entries(block.settings || {})) {
        if (!blockUrls.has(id) || !value) continue;
        if (!String(value).startsWith('shopify://')) {
          note(rel, `section "${key}" block "${blockKey}" setting "${id}" = "${value}" — url settings use the shopify:// scheme`);
        }
      }
    }
  }
}

/* Range settings must land on min + n * step.

   Shopify REJECTS a section schema whose range default violates this, and a
   rejected schema takes every template referencing that section with it. A
   default of 72 on a 40-90 range with step 5 removed the homepage from the
   store entirely — every other route worked, and `/` returned 404. */
function checkRange(file, where, setting, value) {
  if (setting.type !== 'range' || value === undefined || value === null) return;
  const { min, max, step, id } = setting;
  if (typeof min !== 'number' || typeof max !== 'number' || typeof step !== 'number') return;

  if (value < min || value > max) {
    note(file, `${where} "${id}" = ${value} is outside its ${min}–${max} range`);
    return;
  }
  const steps = (value - min) / step;
  if (Math.abs(steps - Math.round(steps)) > 1e-9) {
    note(file, `${where} "${id}" = ${value} is not min(${min}) + n x step(${step}) — Shopify rejects this`);
  }
}

for (const rel of liquidFiles.filter((f) => f.startsWith('sections/'))) {
  const schema = sectionSchema(path.basename(rel, '.liquid'));
  if (!schema) continue;
  for (const setting of schema.settings || []) {
    checkRange(rel, 'schema default', setting, setting.default);
  }
  for (const block of schema.blocks || []) {
    for (const setting of block.settings || []) {
      checkRange(rel, `block ${block.type} default`, setting, setting.default);
    }
  }
}

{
  const globals = JSON.parse(read(path.join(root, 'config/settings_schema.json')));
  for (const group of globals) {
    for (const setting of group.settings || []) {
      checkRange('config/settings_schema.json', 'default', setting, setting.default);
    }
  }
}

for (const f of listFiles('templates', '.json')) {
  const rel = `templates/${f}`;
  let json;
  try {
    json = JSON.parse(read(path.join(root, rel)));
  } catch {
    continue;
  }
  for (const [key, cfg] of Object.entries(json.sections || {})) {
    const schema = sectionSchema(cfg.type);
    if (!schema) continue;
    for (const setting of schema.settings || []) {
      checkRange(rel, `section "${key}"`, setting, (cfg.settings || {})[setting.id]);
    }
    for (const [blockKey, block] of Object.entries(cfg.blocks || {})) {
      const def = (schema.blocks || []).find((b) => b.type === block.type);
      if (!def) continue;
      for (const setting of def.settings || []) {
        checkRange(rel, `section "${key}" block "${blockKey}"`, setting, (block.settings || {})[setting.id]);
      }
    }
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
