import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../public/', import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.png':'image/png', '.webp':'image/webp', '.txt':'text/plain; charset=utf-8', '.xml':'application/xml' };
http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    // Clean URLs: /terms.html redirects to /terms, and /terms serves terms.html.
    const legacy = pathname.match(/^\/(privacy|terms)\.html$/);
    if (legacy) { res.writeHead(301, { Location: `/${legacy[1]}` }); return res.end(); }
    let relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    if (!path.extname(relative)) relative += '.html';
    const file = path.resolve(root, relative);
    const inside = path.relative(root, file);
    if (inside.startsWith('..') || path.isAbsolute(inside) || !(await stat(file)).isFile()) throw new Error('Not found');
    res.writeHead(200, { 'Content-Type':types[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options':'nosniff', 'Cache-Control':'no-cache' });
    res.end(await readFile(file));
  } catch { res.writeHead(404, {'Content-Type':'text/plain'}); res.end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`UniBuddy preview: http://127.0.0.1:${port}`));
