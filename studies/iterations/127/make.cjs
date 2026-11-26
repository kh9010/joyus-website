// Study 127: 126's page on white, Joyus's own ink and greys, no lines between the parts, sentence case; one page per typeface.
//   node studies/iterations/127/make.cjs        (reads ../126/case.html, writes f-<id>.html here)
const fs = require('fs'), path = require('path');
const here = __dirname;
// each with its own natural spacing (parts, headlines), so none is judged in another face's tracking; Space Grotesk keeps 126's
const FONTS = [
  ['space', 'Space Grotesk', -.025, -.04], ['bricolage', 'Bricolage Grotesque', -.015, -.03], ['instrument', 'Instrument Sans', 0, -.02],
  ['schibsted', 'Schibsted Grotesk', -.01, -.03], ['familjen', 'Familjen Grotesk', 0, -.02], ['dmsans', 'DM Sans', -.01, -.03],
];
const base = fs.readFileSync(path.join(here, '../126/case.html'), 'utf8');
for (const [id, family, part, head] of FONTS) {
  let s = base;
  const rep = (a, b) => { if (s.split(a).length !== 2) throw new Error(id + ': not once: ' + a.slice(0, 90)); s = s.replace(a, b); };
  const q = family.replace(/ /g, '+');
  rep('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap', `https://fonts.googleapis.com/css2?family=${q}:wght@400;500;700&display=swap`);
  // white, and Joyus's own ink, soft and pale (styles.css); no hairline between the parts
  rep(":root{--paper:#F4F1EA;--ink:#15161A;--wait:#6E6C66;--hot:#C2185B;--soft:#4A4740;--hair:rgba(21,22,26,.14);",
      ":root{--paper:#FFFFFF;--ink:#2C3544;--wait:#8892A0;--hot:#E91E7B;--soft:#54606F;--hair:transparent;");
  rep("--say:'Space Grotesk',system-ui,sans-serif;--text:'Space Grotesk',system-ui,sans-serif;--sans:'Space Grotesk',system-ui,sans-serif}",
      `--say:'${family}',system-ui,sans-serif;--text:'${family}',system-ui,sans-serif;--sans:'${family}',system-ui,sans-serif}`);
  rep(".t{display:flex;align-items:center;justify-content:flex-start;text-align:left;border-top:1.5px solid var(--hair);", ".t{display:flex;align-items:center;justify-content:flex-start;text-align:left;");
  rep("@media(max-width:760px){.top nav{display:none}", "@media(max-width:760px){:root{--wait:#6B7684}.top nav{display:none}");
  rep('var(--sans);letter-spacing:-.025em;', `var(--sans);letter-spacing:${part}em;`);
  rep('.t{font-size:14.5px;line-height:1.1;letter-spacing:-.02em}', `.t{font-size:14.5px;line-height:1.1;letter-spacing:${part}em}`);
  s = s.split('var(--say);letter-spacing:-.04em;').join(`var(--say);letter-spacing:${head}em;`);
  // sentence case, as 99 had it: capitals hide a typeface's character and made the question cramped
  s = s.replace(/text-transform:uppercase;/g, '');
  s = s.replace(/const paper = 'rgb\(244, 241, 234\)';/, "const paper = 'rgb(255, 255, 255)';");
  s = s.replace(/\/\* 126\. Step 2 with one change:[\s\S]*?\*\//, `/* 127 ${id}. 126 on white with Joyus's own ink and greys, no lines between the parts (the air divides them, as in 99),
   sentence case, and one typeface: ${family}. Everything else is 126: 99's grid, seafoam, the bar of six, underlines. */`);
  if (!s.includes(`'${family}'`) || s.includes('#F4F1EA')) throw new Error(id + ': not applied');
  fs.writeFileSync(path.join(here, `f-${id}.html`), s);
}
console.log(FONTS.length + ' pages written');
