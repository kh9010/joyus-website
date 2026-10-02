// Serves the homepage studies on http://localhost:8794/studies/.
// The root is the whole site, not just studies/, so a study can link to the
// real pages it is talking about (../../../index.html) and they open as they
// are today. Port 8794 sits next to ueno (8791), metro-museum-unity (8792)
// and nid-paper (8793).
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const port = 8794;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4',
  '.pdf': 'application/pdf', '.woff2': 'font/woff2', '.woff': 'font/woff',
};
http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
  if (pathname === '/') { res.writeHead(302, { Location: '/studies/' }).end(); return; }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = path.resolve(root, '.' + pathname);
  const relative = path.relative(root, file);
  if (relative.startsWith('..') || path.isAbsolute(relative) || !types[path.extname(file).toLowerCase()]) { res.writeHead(404).end('Not found'); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()], 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(port, '127.0.0.1', () => console.log('Joyus homepage studies: http://localhost:' + port + '/studies/'));
