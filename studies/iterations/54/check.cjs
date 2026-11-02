// Study 54: every client's logo; the five redone come from Divya's own files; every file is real and links to itself.
const fs = require('node:fs');
const path = require('node:path');
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const imgs = [...html.matchAll(/<a class="zoom[^"]*" href="(logos\/[^"]+)"><img src="(logos\/[^"]+)" alt="([^"]+)"/g)].map(m => ({ href: m[1], src: m[2], alt: m[3] }));
const CLIENTS = ['Tatsam', 'TomboyX', 'Gliitch', 'Agemo', 'Secret Senses', 'XTDB', 'Pratham USA', 'ConveGenius', 'Rachna Nivas', 'Klydo', 'East West Club', 'Cranberry', 'Shapeshifter', 'Armoire'];
say(imgs.map(i => i.alt).join() === CLIENTS.join(), imgs.length + ' logos, the clients in order');
say(imgs.every(i => i.href === i.src), 'each logo links to its own full file');
const small = imgs.filter(i => { const f = path.join(__dirname, i.src); return !fs.existsSync(f) || fs.statSync(f).size < 200; }).map(i => i.src);
say(!small.length, 'every file exists and is not empty' + (small.length ? ': ' + small.join(', ') : ''));
say((html.match(/class="own"/g) || []).length === 5, 'five marked as from the originals');
process.exitCode = bad ? 1 : 0;
