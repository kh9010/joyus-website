// Study 13: the one-pager. Every link goes to the one page (and its three
// sections exist), a piece or experiment page, mail, or the live podcast.
const fs = require('node:fs');
const path = require('node:path');
const r = require('../../wirecheck.cjs').reporter();
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const home = read('onepager.html');
['work', 'about', 'say-hi'].forEach(id => home.includes(`id="${id}"`) ? r.ok('#' + id + ' exists') : r.fail('#' + id + ' missing'));
const ok = /^(onepager\.html(#(work|about|say-hi))?$|piece\.html\?p=|experiment\.html\?p=|mailto:|\.\.\/\.\.\/\.\.\/podcast\.html$|\$\{|wire\.css$)/;
for (const f of ['onepager.html', 'piece.html', 'experiment.html']) {
  const hrefs = [...read(f).matchAll(/href="([^"]*)"/g)].map(m => m[1]);
  const bad = hrefs.filter(h => !ok.test(h));
  bad.length ? r.fail(f + ' links elsewhere: ' + [...new Set(bad)].join(', ')) : r.ok(f + ': ' + hrefs.length + ' links, all to the one page, a piece, mail or the podcast');
}
fs.existsSync(path.resolve(__dirname, '../../../podcast.html')) ? r.ok('podcast.html exists') : r.fail('podcast.html missing');
r.done();
