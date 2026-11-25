// Study 118: the pictures, and what the check reads. Needs the studies server on 8794. One headless Chrome at a time.
//   node studies/iterations/118/shoot.mjs      the three pages, wide and phone -> shots/, report.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chrome, sleep } from './cdp.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const base = 'http://127.0.0.1:8794/studies/iterations/118/';
const until = async (c, expr, ms = 90000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await c.evaluate(expr)) return true; await sleep(150); } return false; };
const c = await chrome();
try {
  const report = { at: new Date().toISOString(), pages: { a: {}, b: {}, c: {} } };
  for (const [w, h, tag] of [[1440, 900, 'wide'], [390, 844, 'phone']]) {
    const shot = (n) => c.shot(path.join(here, 'shots', `${tag}-${n}.png`)), m = () => c.evaluate('window.__measure()');
    // a: it grows until it meets
    await c.visit(base + 'a.html?fast=3', w, h); await c.waitFor('window.__ready', 30000); await c.evaluate('window.__hold = true, 1');
    const a = {}; a.empty = await m(); await shot('a-empty');
    await until(c, 'window.__measure().pieces >= 9'); a.some = await m(); await shot('a-some');
    const spot = await c.evaluate('window.__open()'); a.before = await m(); a.planted = spot ? await c.evaluate(`window.__plant(${spot[0]}, ${spot[1]})`) : false; a.after = await m();
    a.outside = await c.evaluate('window.__plant(-5, -5)');
    await until(c, 'window.__measure().coverage > .55'); a.half = await m(); await shot('a-half');
    a.reachedFull = await until(c, 'window.__measure().phase === "full"'); await sleep(300); a.full = await m(); await shot('a-full');
    await c.evaluate('window.__hold = false, 1'); a.emptied = await until(c, 'window.__measure().rounds >= 1', 20000); a.next = await m();
    a.errors = c.errors.slice(); a.scrollWidth = await c.evaluate('document.documentElement.scrollWidth'); a.innerWidth = w; report.pages.a[tag] = a;
    // b: big first, then what is left
    await c.visit(base + 'b.html?fast=2', w, h); await c.waitFor('window.__ready', 60000); await c.evaluate('window.__hold = true, 1');
    const b = {}; await until(c, 'window.__measure().shown >= 4'); await sleep(120); b.big = await m(); await shot('b-big');
    await until(c, 'window.__measure().shown >= 30'); b.some = await m(); await shot('b-some');
    b.reachedFull = await until(c, 'window.__measure().phase === "full"'); await sleep(400); b.full = await m(); await shot('b-full');
    await c.evaluate('window.__hold = false, 1'); b.emptied = await until(c, 'window.__measure().rounds >= 1', 20000); b.next = await m();
    b.errors = c.errors.slice(); b.scrollWidth = await c.evaluate('document.documentElement.scrollWidth'); b.innerWidth = w; report.pages.b[tag] = b;
    // c: words fill the box
    await c.visit(base + 'c.html', w, h); await c.waitFor('window.__ready', 30000);
    const t = {}; t.empty = await m(); await shot('c-empty');
    await until(c, 'window.__measure().allIn'); await sleep(600); t.filled = await m(); await shot('c-filled');
    const sizes = tag === 'wide' ? [[980, 330], [300, 640], [640, 640]] : [[340, 250], [200, 600], [340, 520]];
    t.boxes = [];
    for (const [i, [bw, bh]] of sizes.entries()) { await c.evaluate(`window.__size(${bw}, ${bh}), 1`); await sleep(350); t.boxes.push(await m()); await shot('c-box' + (i + 1)); }
    t.errors = c.errors.slice(); t.scrollWidth = await c.evaluate('document.documentElement.scrollWidth'); t.innerWidth = w; report.pages.c[tag] = t;
    console.log(tag, 'errors', c.errors.length, c.errors[0] || '');
  }
  fs.writeFileSync(path.join(here, 'report.json'), JSON.stringify(report, null, 1));
} finally { c.close(); }
