// Study 09: the person page. The founders' bios are Kahran's finished copy, so
// the test here is paragraph-level: every bio paragraph on a wireframe must be
// a whole paragraph of about.html, and every paragraph of each bio must appear.
const fs = require('node:fs');
const path = require('node:path');
const w = require('../../wirecheck.cjs');
const r = w.reporter();
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const repo = path.resolve(__dirname, '../../..');
const aboutHtml = fs.readFileSync(path.join(repo, 'about.html'), 'utf8');
const norm = (s) => w.text(s).replace(/’/g, "'").replace(/\s*see more about (him|her) →\s*$/, '').trim();
// the bio paragraphs in about.html, per founder (the <p>s after each founder-name)
const bio = (name) => {
  const i = aboutHtml.indexOf('founder-name">' + name);
  // up to the next founder (or the end of the founders section); there is no
  // </article> to stop at, which made the first version read Divya into Kahran
  const next = aboutHtml.indexOf('founder-name"', i + 20);
  const chunk = aboutHtml.slice(i, next > 0 ? next : aboutHtml.indexOf('</section>', i));
  return [...chunk.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(m => norm(m[1])).filter(t => t.length > 30 || /Kharagpur|Tufts/.test(t));
};
const K = bio('Kahran Singh'), D = bio('Divya Tak');
console.log('source: about.html has ' + K.length + ' Kahran paragraphs, ' + D.length + ' Divya paragraphs');
if (!K.length || !D.length) r.fail('could not read the bios out of about.html');

function bioCheck(html, who, paras) {
  const ps = [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(m => norm(m[1]));
  const missing = paras.filter(p => !ps.includes(p));
  missing.length ? r.fail(who + ': ' + missing.length + ' paragraph(s) of about.html missing or altered: "' + missing[0].slice(0, 60) + '…"') : r.ok(who + ': all ' + paras.length + ' paragraphs, each whole and identical to about.html');
  // a paragraph that is only part of an about.html paragraph means one was split
  const all = [...K, ...D];
  const fragments = ps.filter(p => !all.includes(p) && all.some(a => a.includes(p) && a !== p) && p.length > 20);
  fragments.length ? r.fail(who + ': a bio paragraph was split: "' + fragments[0].slice(0, 60) + '…"') : r.ok(who + ': no paragraph split off from its bio');
  // order kept
  const idx = paras.map(p => ps.indexOf(p));
  idx.every((x, i) => i === 0 || x > idx[i - 1]) ? r.ok(who + ': paragraphs in their original order') : r.fail(who + ': paragraph order changed');
}

console.log('person-a-own-page.html');
const a = read('person-a-own-page.html');
w.links(a, r, ['external']);
w.chrome(a, r);
bioCheck(a, 'Kahran', K);
const url = (a.match(/\/(kahran-singh\.html)/) || [])[1];
url && fs.existsSync(path.join(repo, url)) ? r.ok('the page claims /' + url + ', which exists today as a stub to replace') : r.fail('the URL A claims is not an existing stub');
const heads = [...a.matchAll(/<h2[^>]*>([^<]+)<small>map: ([^<]+)<\/small>/g)].map(m => m[2]);
heads.join('|') === 'history|current interests|find me' ? r.ok("sections are the map's branches for Kahran, in its order: " + heads.join(' · ')) : r.fail('sections ' + heads.join(', '));
w.anchors(a).some(x => x.to === 'person' && /Divya/.test(x.text) && !/^Divya$/.test(x.text)) ? r.ok('links across to Divya') : r.fail('no link to the other founder');

console.log('person-b-one-page.html');
const b = read('person-b-one-page.html');
w.links(b, r, ['external']);
w.chrome(b, r);
bioCheck(b, 'Kahran', K);
bioCheck(b, 'Divya', D);
const labels = (cls) => [...b.matchAll(new RegExp('<div class="' + cls + '"><span class="ml">([^<]+)</span>', 'g'))].map(m => m[1]);
labels('k').join('|') === 'history|current interests|find me' ? r.ok("Kahran's rows carry his map labels") : r.fail('Kahran labels ' + labels('k').join(','));
labels('d').join('|') === 'history|currently|find me' ? r.ok("Divya's rows carry hers (\"currently\", as the map has it)") : r.fail('Divya labels ' + labels('d').join(','));
['kahran-singh.html', 'divya-tak.html'].every(f => fs.existsSync(path.join(repo, f))) && /kahran-singh\.html and \/divya-tak\.html point to #kahran and #divya/.test(b) ? r.ok('both old URLs exist and B says where they go') : r.fail('B does not account for the old URLs');
r.done();
