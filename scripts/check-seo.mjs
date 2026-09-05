/* SEO regression check for the locally rendered storefront. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dev', 'dist');
const files = ['index.html', 'product.html', 'product-metafields.html', 'product-simple.html', 'collection.html', 'cart.html', 'search.html', 'page.html', '404.html'];
const problems = [];

function one(html, pattern) {
  return (html.match(pattern) || [])[1] || '';
}

for (const file of files) {
  const html = fs.readFileSync(path.join(dist, file), 'utf8');
  const title = one(html, /<title>([\s\S]*?)<\/title>/).replace(/\s+/g, ' ').trim();
  const description = one(html, /<meta name="description" content="([^"]*)"/);
  const canonical = one(html, /<link rel="canonical" href="([^"]*)"/);
  const robots = one(html, /<meta name="robots" content="([^"]*)"/);
  const h1Count = (html.match(/<h1\b/g) || []).length;

  if (!title) problems.push(`${file}: missing title`);
  if (!description) problems.push(`${file}: missing meta description`);
  if (description.length > 160) problems.push(`${file}: meta description exceeds 160 characters`);
  if (!/^https:\/\//.test(canonical)) problems.push(`${file}: canonical URL is not absolute HTTPS`);
  if (!one(html, /<meta property="og:title" content="([^"]*)"/)) problems.push(`${file}: missing Open Graph title`);
  if (!one(html, /<meta name="twitter:card" content="([^"]*)"/)) problems.push(`${file}: missing Twitter card`);
  if (h1Count !== 1) problems.push(`${file}: expected one H1, found ${h1Count}`);

  const utility = ['cart.html', 'search.html', '404.html'].includes(file);
  if (utility && !robots.startsWith('noindex')) problems.push(`${file}: utility page must be noindex`);
  if (!utility && !robots.startsWith('index')) problems.push(`${file}: storefront page must be indexable`);

  const schemas = [];
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      schemas.push(JSON.parse(match[1]));
    } catch (error) {
      problems.push(`${file}: invalid JSON-LD — ${error.message}`);
    }
  }

  const schemaTypes = schemas.flatMap((schema) => schema['@graph'] ? schema['@graph'].map((item) => item['@type']) : [schema['@type']]);
  if (file === 'index.html' && (!schemaTypes.includes('Organization') || !schemaTypes.includes('WebSite'))) {
    problems.push(`${file}: missing Organization or WebSite schema`);
  }
  if (file.startsWith('product') && (!schemaTypes.includes('Product') || !schemaTypes.includes('BreadcrumbList'))) {
    problems.push(`${file}: missing Product or BreadcrumbList schema`);
  }
  if (file === 'collection.html' && !schemaTypes.includes('BreadcrumbList')) {
    problems.push(`${file}: missing BreadcrumbList schema`);
  }

  const product = schemas.find((schema) => schema['@type'] === 'Product');
  if (product) {
    if (!Array.isArray(product.offers) || product.offers.length === 0) problems.push(`${file}: Product has no offers`);
    if (!Array.isArray(product.image) || product.image.some((url) => !/^https:\/\//.test(url))) problems.push(`${file}: Product images must be absolute HTTPS URLs`);
    for (const offer of product.offers || []) {
      if (offer.priceCurrency !== 'INR') problems.push(`${file}: offer currency is not INR`);
      if (typeof offer.price !== 'number') problems.push(`${file}: offer price is not numeric`);
      if (!/^https:\/\/schema\.org\/(InStock|OutOfStock)$/.test(offer.availability)) problems.push(`${file}: invalid offer availability`);
    }
  }
}

const robotsTemplate = fs.readFileSync(path.join(root, 'templates', 'robots.txt.liquid'), 'utf8');
if (!robotsTemplate.includes('robots.default_groups')) problems.push('robots.txt.liquid: does not preserve Shopify default groups');
if (!robotsTemplate.includes('group.sitemap')) problems.push('robots.txt.liquid: does not output Shopify sitemap declarations');

const robotsText = fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8');
if (!/^User-agent:/m.test(robotsText)) problems.push('robots.txt: missing user-agent group');
if (!/^Disallow: \/cart$/m.test(robotsText)) problems.push('robots.txt: cart is not excluded');
if (!/^Disallow: \/search$/m.test(robotsText)) problems.push('robots.txt: search is not excluded');
if (!/^Sitemap: https:\/\/[^\s]+\/sitemap\.xml$/m.test(robotsText)) problems.push('robots.txt: missing absolute sitemap URL');

const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
if (!sitemap.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) problems.push('sitemap.xml: invalid URL set');
if (!sitemap.includes('/products/strata-resin-tray</loc>')) problems.push('sitemap.xml: missing product URL');
if (!sitemap.includes('/collections/all</loc>')) problems.push('sitemap.xml: missing collection URL');
if (sitemap.includes('/cart</loc>') || sitemap.includes('/search</loc>')) problems.push('sitemap.xml: contains a utility URL');

if (problems.length) {
  console.error(`SEO check failed (${problems.length} problem${problems.length === 1 ? '' : 's'}):`);
  problems.forEach((problem) => console.error(`  - ${problem}`));
  process.exit(1);
}

console.log(`SEO check passed — ${files.length} pages plus robots and sitemap fixtures.`);
