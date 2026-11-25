// Study 116: Joyus's brand set out part by part, as it is now and as the new (Voronoi) direction has it.
// The list of parts follows the sections of a client's brand guide (identity, visual identity, tone, photography);
// none of that guide's own content is on the page.
//  - three tables; every row has all four cells: the part, now, new, where it stands
//  - every picture is a link to its own full file and exists; at most three pictures in a cell
//  - the colours shown are the ones in the sources: the old system's tokens (DESIGN-LANGUAGE.md) and the stones'
//    palette (the live page's jbuilder.js, as kept in Study 40)
//  - the site map's types of work are quoted as they are in the site map
//  - where the brand lab is on this machine (../joyus/brand-lab, a separate repo), its tagline and typeface are
//    checked against it; skipped where it is missing
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
const repo = path.resolve(here, '..', '..', '..');
let bad = 0;
const say = (ok, msg) => { if (!ok) bad++; console.log((ok ? '  ok   ' : '  FAIL ') + msg); };
const html = fs.readFileSync(path.join(here, 'index.html'), 'utf8');
const tables = html.split('<table class="parts">').slice(1).map(t => t.split('</table>')[0]);
const rows = tables.flatMap(t => t.split('<tbody>')[1].split('<tr>').slice(1));
say(tables.length === 3 && rows.length === 21, tables.length + ' tables, ' + rows.length + ' parts');
say(rows.every(r => (r.match(/<td/g) || []).length === 4), 'every part has four cells: the part, now, new, where it stands');
const cells = rows.flatMap(r => r.split('<td').slice(1));
say(cells.every(c => (c.match(/<img /g) || []).length <= 3), 'at most three pictures in a cell');
const figs = [...html.matchAll(/<a class="zoom pic" href="([^"]+)"><img src="([^"]+)"/g)];
say(figs.length >= 18 && figs.every(m => m[1] === m[2] && fs.existsSync(path.join(here, m[1]))), figs.length + ' pictures, each a link to its own full file');
const hex = [...html.matchAll(/<i style="background:(#[0-9a-fA-F]{6})">/g)].map(m => m[1]);
const audit = fs.readFileSync(path.join(repo, 'DESIGN-LANGUAGE.md'), 'utf8');
say(hex.slice(0, 5).every(h => audit.includes(h)), 'the five colours under Now are the old system\'s tokens: ' + hex.slice(0, 5).join(' '));
const jb = fs.readFileSync(path.join(here, '..', '40', 'jbuilder.js'), 'utf8');
say(hex.slice(5).length === 4 && hex.slice(5).every(h => jb.includes(h)), 'the four colours under New are the stones\' palette: ' + hex.slice(5).join(' '));
const sm = fs.readFileSync(path.join(here, '..', '..', 'sitemap', 'pages.json'), 'utf8');
say(['Branding', 'Website & Product', 'Strategy', 'Storytelling'].every(t => sm.includes('"' + t + '"')), 'the four types of work are in the site map');
say(!/class="(eyebrow|lede)"/.test(html) && /<meta name="robots" content="noindex/.test(html), 'nothing above the title; noindex');
const lab = path.resolve(repo, '..', 'joyus', 'brand-lab', 'index.html');
if (!fs.existsSync(lab)) console.log('  skip the tagline and typeface against the brand lab: ../joyus/brand-lab is not on this machine');
else { const L = fs.readFileSync(lab, 'utf8'); say(L.includes('Cohesion without standardising') && /Montserrat/.test(L), 'the lab\'s tagline and its typeface (Montserrat) are as the page says'); }
process.exitCode = bad ? 1 : 0;
