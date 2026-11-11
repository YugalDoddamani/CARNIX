// npm run serve — a tiny static file server for working on the tour locally.
// The tour is plain files, so any static server works; this one exists so no
// install is needed and so nothing is ever served from the browser cache.
//
//   node tools/serve.mjs [port]      (default 4173, or $PORT)
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.argv[2] || process.env.PORT || 4173);
const HOST = process.env.HOST || '0.0.0.0';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
};

async function resolveFile(urlPath) {
  const relative = normalize(decodeURIComponent(urlPath)).replace(/^([/\\]|\.\.[/\\])+/, '');
  let file = join(ROOT, relative);
  if (file !== ROOT.replace(/[/\\]$/, '') && !file.startsWith(ROOT.endsWith(sep) ? ROOT : ROOT + sep)) return null;
  let info = await stat(file).catch(() => null);
  if (info?.isDirectory()) {
    file = join(file, 'index.html');
    info = await stat(file).catch(() => null);
  }
  return info?.isFile() ? { file, size: info.size } : null;
}

const server = createServer(async (request, response) => {
  try {
    const { pathname } = new URL(request.url, 'http://localhost');
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    const found = await resolveFile(pathname);
    if (!found) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
      return;
    }
    response.writeHead(200, {
      'Content-Type': TYPES[extname(found.file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': found.size,
      'Cache-Control': 'no-store',
    });
    if (request.method === 'HEAD') response.end();
    else createReadStream(found.file).pipe(response);
  } catch (error) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Bad request');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Lab tour: http://localhost:${PORT}/  (serving ${ROOT})`);
});
