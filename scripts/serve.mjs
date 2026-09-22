/**
 * Zero-dependency static server for local development.
 *   npm run serve            -> http://localhost:8788
 * Serves ./site (respecting 404.html) and mimics the Pages 404 behaviour.
 *
 * The API CORS allow-list already includes http://localhost:8788, so the page can talk to
 * the production API. To test against a local Worker instead:
 *   npx wrangler dev --config api/wrangler.toml      (http://localhost:8787)
 *   localStorage.setItem('trendvid_api_base', 'http://localhost:8787')
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';

const ROOT = join(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), 'site');
const PORT = Number(process.env.PORT || 8788);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

async function resolveFile(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^([/\\])+/, '');
  if (clean.includes(`..${sep}`) || clean.includes('../')) return null; // no path traversal
  let target = join(ROOT, clean);
  try {
    const info = await stat(target);
    if (info.isDirectory()) target = join(target, 'index.html');
  } catch {
    return null;
  }
  try {
    await stat(target);
    return target;
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  const file = await resolveFile(req.url || '/');
  if (!file) {
    const notFound = join(ROOT, '404.html');
    try {
      const body = await readFile(notFound);
      res.writeHead(404, { 'content-type': MIME['.html'] });
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('404');
    }
    console.log(`404  ${req.url}`);
    return;
  }

  const body = await readFile(file);
  res.writeHead(200, {
    'content-type': MIME[extname(file)] || 'application/octet-stream',
    // match production: HTML revalidates, app code gets a short TTL
    'cache-control': file.endsWith('.html') ? 'public, max-age=0, must-revalidate' : 'public, max-age=300',
  });
  res.end(body);
  console.log(`200  ${req.url}`);
});

server.listen(PORT, () => {
  console.log(`TrendVid dev server: http://localhost:${PORT}  (serving ${ROOT})`);
});
