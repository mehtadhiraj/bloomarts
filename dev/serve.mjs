/* Static file server for dev/dist. No dependencies, no caching. */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const port = Number(process.env.PORT || 4321);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff2': 'font/woff2'
};

/* Shopify storefront URLs do not have file extensions. Route them to the
   representative harness pages so navigation can be tested end to end. */
function storefrontFallback(urlPath) {
  if (/^\/collections(?:\/[^/]+)?\/?$/.test(urlPath)) return 'collection.html';
  if (/^\/products\/[^/]+\/?$/.test(urlPath)) return 'product.html';
  if (/^\/pages\/[^/]+\/?$/.test(urlPath)) return 'page.html';
  if (/^\/cart\/?$/.test(urlPath)) return 'cart.html';
  if (/^\/search\/?$/.test(urlPath)) return 'search.html';
  return null;
}

http
  .createServer((req, res) => {
    // Strip the transform query image_url appends; the placeholder file is
    // the same regardless of the requested width.
    const url = decodeURIComponent(req.url.split('?')[0]);
    let file = path.join(root, url === '/' ? 'index.html' : url);

    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      file = path.join(file, 'index.html');
    }
    if (!fs.existsSync(file)) {
      const withHtml = `${file}.html`;
      if (fs.existsSync(withHtml)) {
        file = withHtml;
      } else {
        const fallback = storefrontFallback(url);
        if (fallback) {
          file = path.join(root, fallback);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not found');
          return;
        }
      }
    }

    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, () => {
    console.log(`\n  Bloomarts harness → http://localhost:${port}\n`);
  });
