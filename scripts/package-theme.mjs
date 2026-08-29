/* ==========================================================================
   Builds an upload-ready Shopify theme ZIP.

   Shopify requires the theme folders at the ZIP ROOT — not nested inside a
   parent directory — so the archive is built from the repo root with an
   explicit include list rather than by zipping the folder itself.

   Run: npm run package  ->  bloom-arts-theme.zip
   ========================================================================== */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outName = 'bloom-arts-theme.zip';
const outPath = path.join(root, outName);

/* Only these are theme files. Everything else in the repo — the dev harness,
   scripts, docs, node_modules — stays out of the archive. */
const THEME_DIRS = ['assets', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates'];

const missing = THEME_DIRS.filter((d) => !fs.existsSync(path.join(root, d)));
if (missing.length) {
  console.error(`\n  Missing required theme folders: ${missing.join(', ')}\n`);
  process.exit(1);
}

/* Asset filenames must be safe for Shopify: no spaces, no unusual
   characters. Caught here rather than at upload time. */
const badNames = [];
for (const dir of THEME_DIRS) {
  const walk = (d, rel) => {
    for (const entry of fs.readdirSync(path.join(root, d), { withFileTypes: true })) {
      const relPath = path.join(rel, entry.name);
      if (entry.isDirectory()) walk(path.join(d, entry.name), relPath);
      else if (!/^[A-Za-z0-9._-]+$/.test(entry.name)) badNames.push(relPath);
    }
  };
  walk(dir, dir);
}
if (badNames.length) {
  console.error('\n  Unsafe filenames for Shopify:\n');
  badNames.forEach((n) => console.error(`   - ${n}`));
  console.error('');
  process.exit(1);
}

if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

try {
  execFileSync(
    'zip',
    [
      '-r', '-q', '-X',
      outName,
      ...THEME_DIRS,
      // Belt and braces: these should not exist under the theme dirs anyway.
      '-x', '*.DS_Store', '-x', '__MACOSX/*', '-x', '*/node_modules/*'
    ],
    { cwd: root, stdio: ['ignore', 'inherit', 'inherit'] }
  );
} catch (error) {
  console.error(
    '\n  Could not run `zip`. It ships with macOS and most Linux distributions;' +
      '\n  on Windows use WSL or create the archive manually from these folders:' +
      `\n  ${THEME_DIRS.join(', ')}\n`
  );
  process.exit(1);
}

const bytes = fs.statSync(outPath).size;
const mb = bytes / (1024 * 1024);

let fileCount = 0;
for (const dir of THEME_DIRS) {
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(path.join(d, entry.name));
      else fileCount += 1;
    }
  };
  walk(path.join(root, dir));
}

console.log(`\n  ${outName}`);
console.log(`  ${fileCount} files, ${mb.toFixed(2)} MB${mb > 50 ? '  — OVER Shopify\'s 50 MB limit' : '  (limit 50 MB)'}`);
console.log('\n  Upload: Shopify admin -> Online Store -> Themes -> Add theme -> Upload zip file\n');

if (mb > 50) process.exitCode = 1;
