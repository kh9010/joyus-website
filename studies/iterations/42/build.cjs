// Study 42: writes the value grid into both pages from personas.json, so the
// grid is the brand guide word for word and never hand-typed.
//   node studies/iterations/42/build.cjs
// A gets six cards; B gets one table, a row per want, persona and "we give"
// spanning their four rows.
const fs = require('node:fs');
const path = require('node:path');
const { personas } = JSON.parse(fs.readFileSync(path.join(__dirname, 'personas.json'), 'utf8'));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const cards = personas.map(p => `        <div class="persona"><h4>${esc(p.name)}</h4><p class="profile">${esc(p.profile)}</p><ul>${
  p.wants.map(w => `<li><span class="want">${esc(w.want)}</span><span class="today">Today: ${esc(w.today)}</span></li>`).join('')
}</ul><div class="give"><b>${esc(p.giveLabel)}</b><span class="gives">${esc(p.give)}</span></div></div>`).join('\n');

const rows = personas.map(p => p.wants.map((w, i) => `    <tr${i ? '' : ' class="first"'}>${
  i ? '' : `<td class="who" rowspan="${p.wants.length}"><h4>${esc(p.name)}</h4><p>${esc(p.profile)}</p></td>`
}<td class="want">${esc(w.want)}</td><td class="today">${esc(w.today)}</td>${
  i ? '' : `<td class="give" rowspan="${p.wants.length}"><b>${esc(p.giveLabel)}</b><span class="gives">${esc(p.give)}</span></td>`
}</tr>`).join('\n')).join('\n');

for (const [f, html] of [['piece-a-rounds.html', cards], ['piece-b-strategy.html', '    <tbody>\n' + rows + '\n    </tbody>']]) {
  const file = path.join(__dirname, f);
  const src = fs.readFileSync(file, 'utf8');
  if (!/<!--GRID-->[\s\S]*?<!--\/GRID-->/.test(src)) throw new Error(f + ': no <!--GRID--> markers');
  fs.writeFileSync(file, src.replace(/<!--GRID-->[\s\S]*?<!--\/GRID-->/, () => '<!--GRID-->\n' + html + '\n<!--/GRID-->'));
  console.log(f + ': ' + personas.length + ' personas');
}
