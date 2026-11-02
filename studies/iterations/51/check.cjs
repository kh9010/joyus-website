// Study 51: a logo for every client on the Site map, each a real file, each a link to itself.
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const imgs = [...html.matchAll(/<a class="zoom[^"]*" href="(logos\/[^"]+)"><img src="(logos\/[^"]+)" alt="([^"]+)"/g)].map(m => ({ href: m[1], src: m[2], alt: m[3] }));
const CLIENTS = ['Tatsam', 'TomboyX', 'Gliitch', 'Agemo', 'Secret Senses', 'XTDB', 'Pratham USA', 'ConveGenius', 'Rachna Nivas', 'Klydo', 'East West Club', 'Cranberry.Fit', 'Shapeshifter', 'Armoire'];
say(imgs.map(i => i.alt).join() === CLIENTS.join(), imgs.length + ' logos, the clients in order');
say(imgs.every(i => i.href === i.src), 'each logo links to its own full file');
const small = imgs.filter(i => { const f = path.join(__dirname, i.src); return !fs.existsSync(f) || fs.statSync(f).size < 200; }).map(i => i.src);
say(!small.length, 'every file exists and is not empty' + (small.length ? ': ' + small.join(', ') : ''));
const words = html.replace(/<style[\s\S]*?<\/style>/, '').match(/<p class="lede">([^<]*)/)[1].split(/\s+/).length;
say(words < 30, 'one line');
process.exitCode = bad ? 1 : 0;
