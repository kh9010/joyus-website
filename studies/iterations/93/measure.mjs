// Study 93: each option measured live in headless Chrome, at 390 and 1280. Prints JSON for check.cjs:
// { a: { 390: { height, overflow, small, body, contrast, text, errors } , 1280: {...} }, ..., final92: { 390: { height } } }
//   node studies/iterations/93/measure.mjs <base url of the repo root>
import { chrome, sleep } from './cdp.mjs';
const BASE = process.argv[2] || 'http://127.0.0.1:8794/';
const TEXT = `(() => { const b = document.body.cloneNode(true); b.querySelectorAll('style, script, .top nav').forEach(x => x.remove()); return b.textContent; })`;
const PROBE = `(() => { const TEXT = ${TEXT};
  const rgb = (s) => { const m = s.match(/[\\d.]+/g) || [0, 0, 0, 0]; return { r: +m[0], g: +m[1], b: +m[2], a: m[3] === undefined ? 1 : +m[3] }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
  const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  const bgOf = (el) => { let c = { r: 255, g: 255, b: 255, a: 1 }; const chain = []; for (let e = el; e; e = e.parentElement) chain.unshift(getComputedStyle(e).backgroundColor);
    for (const s of chain) { const x = rgb(s); if (x.a > 0) c = over(x, c); } return c; };
  const els = [...document.querySelectorAll('body *')].filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden');
  const small = [], contrast = [], body = [];
  for (const e of els) {
    const cs = getComputedStyle(e), px = parseFloat(cs.fontSize), t = e.textContent.trim().slice(0, 40);
    if (px < 13) small.push(px + 'px ' + t);
    // body text: paragraphs, quotes, the "what fits" lines; labels (.lab, the eyebrow, captions, footer, nav) may be 13-15
    if (e.matches('.lede, .ours, blockquote, blockquote *, .who i, .cost, .closing .big') && px < 16) body.push(px + 'px ' + t);
    const bg = bgOf(e), fg = over(rgb(cs.color), bg), a = lum(fg), b = lum(bg), ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
    if (ratio < 4.5) contrast.push(ratio.toFixed(2) + ' ' + t);
  }
  const W = innerWidth; const overflow = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > W + 1 || r.left < -1); }).map(e => e.className || e.tagName).slice(0, 5);
  const text = TEXT();
  return { height: Math.ceil(document.documentElement.scrollHeight), overflow, small, body, contrast, text, shown: [...document.querySelectorAll('.case')].map(c => c.dataset.opt) };
})()`;
const out = {};
const c = await chrome();
try {
  for (const v of ['a', 'b', 'c', 'd']) {
    out[v] = {};
    for (const w of [390, 1280]) {
      await c.visit(BASE + 'studies/iterations/93/case.html?v=' + v, w, w < 700 ? 844 : 900);
      await c.evaluate('document.fonts.ready.then(() => 1)'); await sleep(300);
      out[v][w] = { ...(await c.evaluate(PROBE)), errors: c.errors.splice(0) };
    }
  }
  await c.visit(BASE + 'studies/iterations/92/final.html', 390, 844);
  await c.evaluate('document.fonts.ready.then(() => 1)'); await sleep(300);
  out.final92 = { 390: { height: await c.evaluate('Math.ceil(document.documentElement.scrollHeight)'), text: await c.evaluate(TEXT + '()') } };
} finally { c.close(); }
console.log(JSON.stringify(out));
