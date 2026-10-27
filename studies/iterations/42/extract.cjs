// Study 42: the six personas, word for word, from the EWC brand guide's two
// "Audience · what we replace" slides. The pages and check.cjs read the
// snapshot (personas.json), so the check runs on a machine without ~/dev/ewc.
//   node studies/iterations/42/extract.cjs [path/to/brand-guide.html]
// With no argument it reads ~/dev/ewc/src/brand-guide.html; --check compares
// instead of writing (check.cjs calls this when the guide is there).
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const GUIDE = process.argv.find(a => a.endsWith('.html')) || path.join(os.homedir(), 'dev/ewc/src/brand-guide.html');
const OUT = path.join(__dirname, 'personas.json');
const text = (s) => s.replace(/<[^>]+>/g, '').replace(/&mdash;/g, '—').replace(/&rsquo;|&#39;/g, "'").replace(/&ldquo;|&rdquo;/g, '"')
  .replace(/&amp;/g, '&').replace(/&eacute;/g, 'é').replace(/\s+/g, ' ').trim();

function personas(html) {
  const out = [];
  for (const m of html.matchAll(/<h3 class="p-name">([\s\S]*?)<\/h3>([\s\S]*?)<div class="p-offer">([\s\S]*?)<\/p><\/div><\/div>/g)) {
    const body = m[2];
    out.push({
      name: text(m[1]).replace(/\.$/, ''),
      profile: text((body.match(/<p class="p-profile">([\s\S]*?)<\/p>/) || [])[1] || ''),
      wants: [...body.matchAll(/<span class="p-swap__want">([\s\S]*?)<\/span><span class="p-swap__today">Today &mdash; <b>([\s\S]*?)<\/b><\/span>/g)]
        .map(w => ({ want: text(w[1]), today: text(w[2]) })),
      giveLabel: text((m[3].match(/<span class="p-offer__label">([\s\S]*?)<\/span>/) || [])[1] || ''),
      give: text((m[3].match(/<p class="p-offer__text">([\s\S]*)$/) || [])[1] || ''),
    });
  }
  return out;
}

if (require.main === module) {
  const got = personas(fs.readFileSync(GUIDE, 'utf8'));
  if (process.argv.includes('--check')) {
    const same = JSON.stringify(got) === JSON.stringify(JSON.parse(fs.readFileSync(OUT, 'utf8')).personas);
    console.log(same ? 'same' : 'differs');
    process.exitCode = same ? 0 : 1;
  } else {
    fs.writeFileSync(OUT, JSON.stringify({ source: 'ewc/src/brand-guide.html, slides "Audience · what we replace"', personas: got }, null, 1) + '\n');
    console.log(got.length + ' personas, ' + got.reduce((n, p) => n + p.wants.length, 0) + ' wants → ' + path.relative(process.cwd(), OUT));
  }
}
module.exports = { personas, GUIDE };
