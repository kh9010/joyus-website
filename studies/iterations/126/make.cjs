// Study 126: 125 c in three steps, each adding one change. step1 = seafoam for orange; step2 = + one typeface; case = + underlines.
//   node studies/iterations/126/make.cjs studies/iterations/125/c.html studies/iterations/126
const fs = require('fs'), path = require('path');
const [src, dir] = process.argv.slice(2);
let s = fs.readFileSync(src, 'utf8');
const rep = (a, b) => { if (s.split(a).length !== 2) throw new Error('not once: ' + a.slice(0, 90)); s = s.replace(a, b); };
const head = (txt) => { s = s.replace(/\/\* 12[56] c[\s\S]*?\*\//, txt); };

// ---- step 1: the second act's colour, orange to seafoam
rep("const COL = ['#f25aa3', '#2fc0d8', '#f5c63c', '#7d55d4', '#ff8a3d', '#2C3544'];", "const COL = ['#f25aa3', '#2fc0d8', '#f5c63c', '#7d55d4', '#3fd0a4', '#2C3544'];");
head(`/* 126 step 1. 125 c with one change: the second act's colour is seafoam (#3fd0a4), not orange. Orange (hue 24) sat inside
   the warm arc pink and yellow already cover; seafoam (hue 162) fills the empty stretch between yellow and cyan, so the six
   fall into a warm pair, a cool three and ink. Everything else is 125 c. */`);
fs.writeFileSync(path.join(dir, 'step1.html'), s);

// ---- step 2: one typeface, Space Grotesk (the live joyus.studio's, and 99's grid's), in three weights
rep('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo+Narrow:wght@500;600;700&family=Space+Grotesk:wght@500;700&display=swap">',
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap">');
rep("--say:'Archivo Black',system-ui,sans-serif;--text:'Archivo Narrow',system-ui,sans-serif;--sans:'Space Grotesk',system-ui,sans-serif}",
    "--say:'Space Grotesk',system-ui,sans-serif;--text:'Space Grotesk',system-ui,sans-serif;--sans:'Space Grotesk',system-ui,sans-serif}");
rep(".top{position:fixed;left:0;right:0;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px clamp(16px,3vw,40px);font:600 14px var(--text);text-transform:uppercase;letter-spacing:.08em}",
    ".top{position:fixed;left:0;right:0;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px clamp(16px,3vw,40px);font:500 15px var(--text)}");
rep(".top .wm{font:21px var(--say);text-transform:none;letter-spacing:-.03em;text-decoration:none}", ".top .wm{font:700 20px var(--say);letter-spacing:-.02em;text-decoration:none}");
rep("font:400 var(--qs)/.94 var(--say);letter-spacing:-.035em;text-transform:uppercase;z-index:5}", "font:700 var(--qs)/.94 var(--say);letter-spacing:-.04em;text-transform:uppercase;z-index:5}");
rep(".cap b{display:inline-block;font:400 clamp(1.15rem,1.8vw,1.6rem)/1.05 var(--say);", ".cap b{display:inline-block;font:700 clamp(1.15rem,1.8vw,1.6rem)/1.05 var(--say);");
rep(".cap span{display:block;color:var(--soft);font:600 clamp(1rem,1.2vw,1.12rem)/1.3 var(--text);margin-top:5px}", ".cap span{display:block;color:var(--soft);font:400 clamp(1rem,1.2vw,1.1rem)/1.35 var(--text);margin-top:5px}");
rep(".cap.say b{display:block;font:700 clamp(1.1rem,1.6vw,1.4rem)/1.2 var(--text);", ".cap.say b{display:block;font:500 clamp(1.1rem,1.6vw,1.4rem)/1.25 var(--text);");
rep(".ans h2{margin:0;font:400 clamp(2.2rem,5.4vw,5rem)/.96 var(--say);letter-spacing:-.035em;text-transform:uppercase}", ".ans h2{margin:0;font:700 clamp(2.2rem,5.4vw,5rem)/.96 var(--say);letter-spacing:-.04em;text-transform:uppercase}");
rep(".ans p{margin:0;align-self:end;max-width:30ch;font:600 clamp(1.2rem,2vw,1.7rem)/1.25 var(--text);color:var(--soft)}", ".ans p{margin:0;align-self:end;max-width:30ch;font:500 clamp(1.15rem,1.9vw,1.6rem)/1.3 var(--text);color:var(--soft)}");
rep(".on a{display:inline-block;font:400 clamp(1.5rem,3.3vw,2.8rem)/1 var(--say);text-transform:uppercase;letter-spacing:-.03em;", ".on a{display:inline-block;font:700 clamp(1.5rem,3.3vw,2.8rem)/1 var(--say);text-transform:uppercase;letter-spacing:-.04em;");
rep(".foot{padding:0 clamp(16px,4vw,56px) 34px;color:var(--wait);font:600 13px var(--text);text-transform:uppercase;letter-spacing:.08em}", ".foot{padding:0 clamp(16px,4vw,56px) 34px;color:var(--wait);font:400 14px var(--text)}");
head(`/* 126 step 2. Step 1 with one change: one typeface. Space Grotesk, the live joyus.studio's own and 99's grid's, in three
   weights (400, 500, 700) for the wordmark, the nav, the question, the person, the parts and the close. Was four: Archivo
   Black, Archivo Narrow and Space Grotesk, plus the nav's spaced capitals. */`);
fs.writeFileSync(path.join(dir, 'step2.html'), s);

// ---- step 3: the colour under the words, not over the cell
rep(".t.lit{color:var(--ink);box-shadow:inset 0 4px 0 0 var(--c)}\n.t.now{box-shadow:inset 0 9px 0 0 var(--c)}",
    "/* the colour is an underline under the words, one unbroken line just below the descenders; 99's thin lines between the rows stay */\n.t.lit{color:var(--ink)}\n.t span{text-decoration:underline;text-decoration-color:transparent;text-decoration-thickness:var(--ut);text-underline-offset:var(--uo);text-decoration-skip-ink:none;transition:text-decoration-color .35s ease;transition-delay:inherit}\n.t.lit span{text-decoration-color:var(--c)}\n.t.now span{--ut:var(--un)}");
rep("@keyframes pass{0%,100%{box-shadow:inset 0 4px 0 0 var(--c)}40%{box-shadow:inset 0 10px 0 0 var(--c)}}", "@keyframes pass{0%,100%{--ut:var(--ul)}40%{--ut:var(--un)}}");
rep("#grid.whole .t{animation:pass .9s cubic-bezier(.7,0,.2,1) both;animation-delay:calc(var(--row) * 120ms)}", "#grid.whole .t span{animation:pass .9s steps(1) both;animation-delay:calc(var(--row) * 120ms)}");
rep("#grid{position:absolute;left:0;top:0;display:grid;column-gap:clamp(18px,2.4vw,36px);row-gap:0;opacity:0;z-index:2}", "#grid{position:absolute;left:0;top:0;display:grid;column-gap:clamp(18px,2.4vw,36px);row-gap:0;opacity:0;z-index:2;--ul:4px;--un:7px;--ut:var(--ul);--uo:.28em}");
rep("@media(max-width:760px){.top nav{display:none}.t{font-size:14.5px;line-height:1.1;letter-spacing:-.02em}", "@media(max-width:760px){.top nav{display:none}.t{font-size:14.5px;line-height:1.1;letter-spacing:-.02em}#grid{--ul:2.5px;--un:3px;--uo:2.5px}");
rep("  const sh = t => getComputedStyle(t).boxShadow, heavy = tiles.filter(t => sh(t).includes(' 9px 0px 0px inset')).length, ruled = tiles.filter(t => [' 4px 0px 0px inset', ' 9px 0px 0px inset', ' 10px 0px 0px inset'].some(x => sh(t).includes(x))).length;",
    "  // underlined: a part's words carry its person's colour as an underline; heavy: the arriving four's; over: any colour left above a cell\n  const ud = t => getComputedStyle(t.firstChild), ruled = tiles.filter(t => ud(t).textDecorationColor !== 'rgba(0, 0, 0, 0)').length, heavy = tiles.filter(t => ud(t).textDecorationColor !== 'rgba(0, 0, 0, 0)' && parseFloat(ud(t).textDecorationThickness) >= (L.phone ? 3 : 7)).length;\n  const over = tiles.filter(t => getComputedStyle(t).boxShadow !== 'none' && !getComputedStyle(t).boxShadow.startsWith('rgba(0, 0, 0, 0)')).length;\n  // the underline stays inside its cell: the last line's foot, plus the offset and the thickness\n  const spill = tiles.filter(t => { const r = R(t), lines = [...t.firstChild.getClientRects()], last = lines[lines.length - 1], u = ud(t), fs = parseFloat(u.fontSize); const uo = u.textUnderlineOffset.endsWith('em') ? parseFloat(u.textUnderlineOffset) * fs : parseFloat(u.textUnderlineOffset); return last.bottom - fs * .22 + uo + parseFloat(u.textDecorationThickness) > r.bottom + .5; }).map(t => t.textContent);");
rep("geometry, heavy, ruled, segs,", "geometry, heavy, ruled, over, spill, segs,");
head(`/* 126. Step 2 with one change: the colour is an underline under each part's words (4px; 7px for the arriving four; thinner
   on a phone), not a rule over the top of the cell. 99's thin lines between the rows stay, as the grid's structure.
   With step 1 (seafoam for orange) and step 2 (one typeface, Space Grotesk), this is 125 c as Divya asked for it. */`);
fs.writeFileSync(path.join(dir, 'case.html'), s);
console.log('step1, step2, case written');
