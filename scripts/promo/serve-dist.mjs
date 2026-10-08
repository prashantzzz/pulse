/**
 * Tiny zero-dependency static server for the production promo build.
 *
 *   npm run build:web     # export the web app into dist/
 *   npm run promo:serve   # serve dist/ on http://localhost:8082 (SPA fallback)
 *
 * Used for recording: the production bundle has no dev overlay, no LogBox and
 * no debug logging, so the screen capture is clean and runs at full speed.
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'dist');
const port = Number(process.env.PORT || 8082);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.wasm': 'application/wasm',
  '.map': 'application/json',
};

const server = createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath = join(root, normalize(urlPath).replace(/^(\.\.[/\\])+/, ''));
  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html');
  }
  // SPA fallback: unknown routes render the app shell.
  if (!existsSync(filePath)) {
    filePath = join(root, 'index.html');
  }
  if (!existsSync(filePath)) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('dist/ not found — run `npm run build:web` first.');
    return;
  }
  const body = readFileSync(filePath);
  res.writeHead(200, {
    'content-type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream',
    'cache-control': 'no-store',
  });
  res.end(body);
});

server.listen(port, () => {
  console.log(`Promo build served at http://localhost:${port} (dist/)`);
});
