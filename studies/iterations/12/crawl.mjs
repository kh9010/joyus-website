// Study 12's test: click through the whole prototype in a real browser.
// Needs Chrome and the studies server (node studies/server.cjs). Writes
// crawl-report.json, which check.cjs (run by verify.cjs) reads; the report
// carries a hash of the site files, so a stale report fails the check.
//   node studies/iterations/12/crawl.mjs
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://127.0.0.1:8794/studies/iterations/12/site/';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9500 + Math.floor(Math.random() * 400);
const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${path.join(os.tmpdir(), 'joycrawl' + port)}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let target;
for (let i = 0; i < 60 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); let loaded = null;
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.method === 'Page.loadEventFired' && loaded) loaded(); if (pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
await send('Page.enable');
const evaluate = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result.value;
async function visit(url, width = 1440) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 700 });
  const done = new Promise(r => { loaded = r; });
  await send('Page.navigate', { url });
  await Promise.race([done, sleep(5000)]);
  await sleep(150);
  return evaluate(`(() => {
    const W = document.documentElement.clientWidth;
    return {
      title: document.title,
      h1: (document.querySelector('h1') || {}).textContent || '',
      missing: !!document.querySelector('.missing'),
      text: document.body.innerText.length,
      overflow: document.documentElement.scrollWidth > W,
      hrefs: [...document.querySelectorAll('a')].map(a => ({ raw: a.getAttribute('href'), abs: a.href, text: a.innerText.trim().slice(0, 60) })),
      ctx: (() => { const c = document.getElementById('ctx'); return c ? !c.hidden : null; })(),
      panel: (() => { const p = document.getElementById('panel'); return p ? { href: p.getAttribute('href'), sentence: document.getElementById('sentence').textContent } : null; })(),
    };
  })()`);
}
const status = async (url) => { try { return (await fetch(url)).status; } catch { return 0; } };

const pages = {}, links = [], outside = {};
const queue = [BASE + 'index.html'];
// the homepage panel shows one piece at a time; park it on each so all 37 panels are visited
const data = (await (await fetch(BASE + 'site-data.js')).text());
const SITE = JSON.parse(data.match(/globalThis\.SITE = (\{[\s\S]*?\});\nglobalThis\.slugTag/)[1]);
const counters = {};
SITE.pieces.forEach(p => { counters[p.pill] = (counters[p.pill] ?? -1) + 1; queue.push(BASE + `index.html?pill=${p.pill}&n=${counters[p.pill]}`); });
const seen = new Set();
while (queue.length) {
  const url = queue.shift();
  if (seen.has(url)) continue; seen.add(url);
  const r = await visit(url);
  const key = url.replace(BASE, '');
  pages[key] = { title: r.title, h1: r.h1.trim(), missing: r.missing, text: r.text, overflow: r.overflow, ctx: r.ctx, panel: r.panel, links: r.hrefs.length };
  for (const h of r.hrefs) {
    links.push({ from: key, raw: h.raw, abs: h.abs, text: h.text });
    if (!h.raw || h.raw === '#') continue;
    if (h.abs.startsWith(BASE)) { const u = h.abs.split('#')[0]; if (!seen.has(u)) queue.push(u); }
    else if (h.abs.startsWith('http://127.0.0.1:8794/')) outside[h.abs] = outside[h.abs] || await status(h.abs);
    else outside[h.abs] = outside[h.abs] || 'external';
  }
}
// phone width: one of each page type
const phone = {};
for (const u of ['index.html', 'work.html', 'piece.html?p=klydo/branding', 'experiment.html?p=metro-museum', 'client.html?c=klydo', 'about.html', 'kahran-singh.html', 'divya-tak.html', 'say-hi.html?from=klydo/branding', 'newsletter.html', 'issue-01.html', 'privacy.html']) phone[u] = (await visit(BASE + u, 390)).overflow;

const siteDir = path.join(here, 'site');
const hash = crypto.createHash('sha256');
for (const f of fs.readdirSync(siteDir).sort()) hash.update(f).update(fs.readFileSync(path.join(siteDir, f)));
fs.writeFileSync(path.join(here, 'crawl-report.json'), JSON.stringify({ when: new Date().toISOString(), siteHash: hash.digest('hex'), pages, links, outside, phone }, null, 1));
console.log('visited ' + Object.keys(pages).length + ' pages, ' + links.length + ' links, ' + Object.keys(outside).length + ' outside the prototype');
ws.close(); proc.kill();
