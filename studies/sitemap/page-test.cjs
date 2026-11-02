// The Site map tab in a real browser (server up; about 20 s; one headless Chrome at a time).
// Counts what is on screen against pages.json read here independently: the tree's shape and depth,
// every item's four-stage path and its status branches, roll-ups, how-far wording, filters; then
// the tab itself and laptop and phone widths.
// node studies/sitemap/page-test.cjs [folder for pictures]
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require(path.resolve(__dirname, '../../../delhi_metro_scraper_project/metro-museum/node_modules/puppeteer'));
const BASE = 'http://127.0.0.1:8794/studies/';
const shots = process.argv[2];
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const D = JSON.parse(fs.readFileSync(path.join(__dirname, 'pages.json'), 'utf8'));
const leaves = n => (n.kids ? n.kids.flatMap(leaves) : [n]);
const nodes = n => [n, ...(n.kids || []).flatMap(nodes)];
const all = D.tree.flatMap(leaves);
const FOUR = ['UX', 'UI', 'Content', 'Refinement'].map(name => ({ name, ids: D.stages.filter(s => s.stage === name).map(s => s.id) }));
const roll = (list, ids) => { const v = list.flatMap(p => ids.map(id => p.s[id][0])); return v.every(x => x === 'd') ? 'd' : v.includes('w') ? 'w' : v.some(x => x !== '0') ? 's' : '0'; };
const howFar = list => { let last = null; for (const f of FOUR) { if (roll(list, f.ids) !== 'd') return last ? 'Done up to ' + last : 'Nothing done yet'; last = f.name; } return 'All done'; };
const ready = page => page.waitForFunction(() => document.body.dataset.ready, { timeout: 15000 });

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.setViewport({ width: 1190, height: 900 });
    await page.goto(BASE + 'sitemap/index.html', { waitUntil: 'networkidle0' });
    await ready(page);

    const got = await page.evaluate(() => {
      const row = li => { const s = li.querySelector(':scope > details > summary'); return { id: li.dataset.id, st: [...s.querySelectorAll('.path .tk')].map(t => t.dataset.s), icons: [...s.querySelectorAll('.path .tk')].map(t => t.dataset.i), say: (s.querySelector('.say') || {}).textContent, name: s.querySelector('.name').textContent }; };
      const depthOf = el => { let d = 0; for (let e = el; e && e.id !== 'tree'; e = e.parentElement) if (e.tagName === 'LI') d++; return d; };
      return {
        leaves: [...document.querySelectorAll('.leaf')].map(row),
        branches: [...document.querySelectorAll('.branch[data-id]')].filter(b => b.querySelector(':scope > details > summary .path')).map(row),
        first: document.querySelector('#tree > li').dataset.id,
        openFirst: document.querySelector('#tree > li > details').open,
        branchIcons: [...document.querySelectorAll('#tree > li > details > summary .badge svg, .lvl2.branch > details > summary .badge svg')].length,
        branchCount: document.querySelectorAll('#tree > li, .lvl2.branch').length,
        deepest: Math.max(...[...document.querySelectorAll('.st-row')].map(depthOf)),
        insideStages: [...document.querySelector('.leaf[data-id="gliitch-identity"]').querySelectorAll('.st-row b')].map(b => b.textContent),
        parts: [...document.querySelector('.leaf[data-id="gliitch-identity"]').querySelectorAll('.part-row a')].map(a => a.textContent),
        statusHeads: document.querySelectorAll('.leaf[data-id="gliitch-identity"] .sub-h').length,
        tree: document.querySelectorAll('.tree ul').length,
        table: document.querySelectorAll('.cells, .heads, .totals').length,
        stages: [...document.querySelectorAll('#stages [data-stage]')].map(d => ({ id: d.dataset.stage, n: d.querySelector('b').textContent })),
        badges: document.querySelectorAll('.badge svg').length,
      };
    });
    const allNodes = D.tree.flatMap(nodes);
    say(got.leaves.length === all.length, 'one row per item: ' + got.leaves.length + ' of ' + all.length);
    say(got.first === 'work-branch' && got.openFirst, 'Work comes first, and open');
    say(got.table === 0 && got.tree > 40, 'a tree, not a table: ' + got.tree + ' nested lists, no table left');
    say(got.deepest >= 6, 'it goes ' + got.deepest + ' levels deep at its deepest');
    say(got.branchIcons === got.branchCount - 1 + 0 || got.branchIcons >= 9, 'the sections carry their icons in the chart (' + got.branchIcons + ')');
    const wrong = got.leaves.filter(r => { const p = all.find(x => x.id === r.id); return !p || r.st.join() !== FOUR.map(f => roll([p], f.ids)).join() || r.say !== howFar([p]); }).map(r => r.id);
    say(!wrong.length, 'every item shows its four-stage path and how far it has got' + (wrong.length ? ': wrong ' + wrong.slice(0, 5).join(', ') : ''));
    say(got.leaves.every(r => r.icons.join() === 'ux,ui,content,refinement'), 'every path has the same four icons in the same order');
    const wrongB = got.branches.filter(b => { const n = allNodes.find(x => x.id === b.id); return !n || b.st.join() !== FOUR.map(f => roll(leaves(n), f.ids)).join() || b.say !== howFar(leaves(n)); }).map(b => b.id);
    say(!wrongB.length, got.branches.length + ' branches roll up from what is under them' + (wrongB.length ? ': wrong ' + wrongB.join(', ') : ''));
    say(got.insideStages.join() === 'UX,UI,Content,Writing,Images,Interactions,Refinement,Strategic,Narrative,Visual', 'Gliitch Branding opens to UX, UI, Content and its three, Refinement and its three');
    say(got.parts.join() === 'Moodboarding,Logo,Video and media guides', 'and to its parts: ' + got.parts.join(', '));
    const workPages = leaves(D.tree[0]).filter(p => p.kind !== 'shape');
    const wrongS = got.stages.filter(s => s.n !== workPages.filter(p => p.s[s.id][0] === 'd').length + '/' + workPages.length);
    say(got.stages.length === 8 && !wrongS.length, 'the head counts Work per stage: ' + got.stages.map(s => s.n).join(' '));
    say(got.stages.find(s => s.id === 'ui').n.startsWith('0/'), 'no UI is done in Work');

    // Divya, 2 Nov: "Why are Coming Soon and 404 so tall?" A tag shared a class name with study.css. No row may be that tall again.
    const tall = await page.evaluate(() => { document.querySelectorAll('#tree details').forEach(d => { d.dataset.was = d.open; d.open = false; }); document.querySelectorAll('#tree details').forEach(d => { d.open = true; }); const rows = [...document.querySelectorAll('#tree summary.node')].map(s => ({ h: s.getBoundingClientRect().height, n: s.querySelector('.name').textContent })); document.querySelectorAll('#tree details').forEach(d => { d.open = d.dataset.was === 'true'; }); return rows.filter(r => r.h > 110).map(r => r.n + ' ' + Math.round(r.h)); });
    say(!tall.length, 'no row is taller than 110px' + (tall.length ? ': ' + tall.slice(0, 5).join(', ') : ''));
    const tagged = await page.evaluate(() => { const t = document.querySelector('.live-tag').getBoundingClientRect(); return { h: t.height, tags: document.querySelectorAll('.live-tag').length }; });
    say(tagged.h < 26 && tagged.tags === 4, tagged.tags + ' live tags, each ' + Math.round(tagged.h) + 'px tall');
    const owners = await page.$$eval('#stages i', i => i.map(x => x.textContent).join());
    say(owners === 'Divya,Kahran,Divya,Both,Both,Kahran,Divya', 'the head names each stage\'s owner: ' + owners);
    const gone = await page.evaluate(() => ['#dec', '#spent', '#notp'].filter(q => document.querySelector(q)));
    say(!gone.length, 'open decisions, where the studies went and not-on-the-tree are gone');
    const measure = () => page.evaluate(() => ({ wide: document.documentElement.scrollWidth, inner: innerWidth, off: [...document.querySelectorAll('#tree summary')].filter(s => s.offsetParent && s.getBoundingClientRect().right > innerWidth + 1).length, paths: new Set([...document.querySelectorAll('.lvl3.leaf > details > summary .status')].filter(s => s.offsetParent).map(s => Math.round(s.getBoundingClientRect().right))).size }));
    if (shots) await page.screenshot({ path: path.join(shots, 'desktop-top.png') });
    await page.evaluate(() => { const l = document.querySelector('.leaf[data-id="gliitch-identity"] > details'); l.open = true; l.scrollIntoView({ block: 'center' }); });
    if (shots) await page.screenshot({ path: path.join(shots, 'gliitch.png') });
    if (shots) await page.screenshot({ path: path.join(shots, 'desktop-full.png'), fullPage: true });
    for (const w of [1440, 1116, 800]) {
      await page.setViewport({ width: w, height: 800 });
      const at = await measure();
      say(at.wide <= at.inner && !at.off && at.paths <= 1, w + 'px: no sideways scroll, all same-level paths line up');
    }
    await page.setViewport({ width: 1190, height: 900 });

    // open-all and back
    await page.click('#openall');
    const allOpen = await page.$$eval('#tree details', d => d.every(x => x.open));
    await page.click('#closeall');
    const backOpen = await page.evaluate(() => ({ work: document.querySelector('#tree > li > details').open, und: document.querySelector('[data-id="undecided"] > details').open }));
    say(allOpen && backOpen.work && !backOpen.und, 'open every item, then back to Work');

    // filters
    for (const who of ['Divya', 'Kahran', 'both']) {
      await page.click('#tools button[data-k="' + who + '"]');
      const shown = await page.$$eval('.leaf:not(.hide)', r => r.map(x => x.dataset.id));
      const want = all.filter(p => D.stages.some(s => p.s[s.id][2] === who)).map(p => p.id).sort();
      say(shown.slice().sort().join() === want.join(), 'waiting on ' + who + ': ' + shown.length);
    }
    await page.click('#tools button[data-k="all"]');
    say((await page.$$eval('.leaf:not(.hide)', r => r.length)) === all.length, '"All" brings every item back');

    // the tab in the rail
    await page.goto(BASE, { waitUntil: 'networkidle0' });
    await page.click('.modes a[data-mode="sitemap"]');
    await page.waitForFunction(() => { const f = document.querySelector('iframe'); try { return f.contentDocument.body.dataset.ready; } catch { return false; } }, { timeout: 15000 });
    const onMap = await page.evaluate(() => ({ cur: document.querySelector('.modes a[aria-current]').dataset.mode, hist: getComputedStyle(document.querySelector('.history')).display, hash: location.hash }));
    say(onMap.cur === 'sitemap' && onMap.hist === 'none' && onMap.hash === '#sitemap', 'Site map tab: the tree in the frame, rail hidden');
    await page.setViewport({ width: 1440, height: 900 });
    if (shots) await page.screenshot({ path: path.join(shots, 'tab.png') });
    await page.click('.modes a[data-mode="studies"]');
    await new Promise(r => setTimeout(r, 400));
    say(/iterations\/63/.test(await page.$eval('iframe', f => f.src)), 'Studies brings the study back');

    // phone
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(BASE + 'sitemap/index.html', { waitUntil: 'networkidle0' });
    await ready(page);
    await page.evaluate(() => { document.querySelector('.leaf[data-id="gliitch-identity"] > details').open = true; document.querySelector('[data-id="comics-page"] > details').open = true; });
    const phone = await page.evaluate(() => ({ wide: document.documentElement.scrollWidth, inner: innerWidth, over: [...document.querySelectorAll('#tree *')].filter(e => { const b = e.getBoundingClientRect(); return b.width && e.offsetParent && b.right > innerWidth + 1; }).slice(0, 5).map(e => e.tagName + '.' + e.className), tap: document.querySelector('.leaf > details > summary').getBoundingClientRect().height }));
    // a phone quietly widens its layout to fit what overflows, so compare to 390, not to innerWidth
    say(phone.wide <= 390 && phone.inner <= 390, 'phone: no sideways scroll (' + phone.wide + ' at ' + phone.inner + ', asked for 390)');
    say(!phone.over.length, 'phone: nothing runs off the right' + (phone.over.length ? ': ' + phone.over.join(', ') : ''));
    say(phone.tap >= 44, 'phone: an item is ' + Math.round(phone.tap) + 'px to tap');
    if (shots) { await page.evaluate(() => document.querySelector('.leaf[data-id="gliitch-identity"]').scrollIntoView()); await page.screenshot({ path: path.join(shots, 'phone-table.png') }); }

    const real = errors.filter(e => !/fonts\.g|ERR_INTERNET|net::/.test(e));
    say(!real.length, 'no console errors' + (real.length ? ': ' + real.slice(0, 3).join(' | ') : ''));
  } finally { await browser.close(); }
  console.log(bad ? bad + ' failure(s)' : 'page holds');
  process.exitCode = bad ? 1 : 0;
})();
