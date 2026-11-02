// Study 56: About, out of the box. Four ideas, each a different answer to "what is it to meet two people?".
// Kahran's paragraphs are never split. Divya's second paragraph is cut at its full stops only where an idea needs dates.
// Each page is its own composition. node build.cjs
const fs = require('node:fs');
const path = require('node:path');
const W = JSON.parse(fs.readFileSync(path.join(__dirname, '../52/words.json'), 'utf8'));
const D = W.divya.paras, K = W.kahran.paras, Y = W.kahran.years, Q = W.kahran.quote;
const dSentences = D.flatMap(p => p.split(/(?<=\.)\s+(?=[A-Z])/));
fs.writeFileSync(path.join(__dirname, 'words.json'), JSON.stringify({ _: 'Generated from 52/words.json', D, K, Y, Q, dSentences }, null, 1));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const shell = (title, css, body, js) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>${title}</title><link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap">
<style>
:root{--ink:#2C3544;--soft:#54606F;--fade:#8892A0;--pink:#E91E7B;--cyan:#4FC4CF;--yellow:#F2C94A;--line:#dfe2e6}
*{box-sizing:border-box}html,body{margin:0}body{font:17px/1.55 'Space Grotesk',system-ui,sans-serif;color:var(--ink);background:#fff}
p{margin:0 0 14px}button{font:inherit;color:inherit}
:focus-visible{outline:3px solid var(--ink);outline-offset:3px}
.hint{font-size:13px;color:var(--fade)}
${css}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style></head><body>
${body}
<script>${js}</script></body></html>
`;
const out = (f, s) => fs.writeFileSync(path.join(__dirname, f), s);

// ---- A: The divide. Two people share one room. Drag the line and one gets more of it; neither can be read whole without giving up the other.
out('about-a.html', shell('A / The divide', `
.room{position:relative;height:100dvh;min-height:560px;overflow:hidden;touch-action:pan-y}
.half{position:absolute;top:0;bottom:0;overflow:hidden}
.half.d{left:0;background:#fff2f8}.half.k{right:0;background:#effafb}
.inner{position:absolute;top:0;bottom:0;width:min(100vw,720px);padding:64px clamp(24px,4vw,56px);overflow:auto}
.d .inner{left:0}.k .inner{right:0}
h2{font:700 clamp(2rem,5vw,3.6rem)/1.02 'Space Grotesk';letter-spacing:-.03em;margin:0 0 22px}
.d h2{color:var(--pink)}.k h2{color:#1a98a4}
.line{position:absolute;top:0;bottom:0;width:44px;margin-left:-22px;cursor:ew-resize;background:none;border:0;padding:0;z-index:2}
.line::before{content:'';position:absolute;left:21px;top:0;bottom:0;width:2px;background:var(--ink)}
.line::after{content:'⟷';position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:44px;height:44px;line-height:44px;text-align:center;background:var(--ink);color:#fff;border-radius:50%;font-size:16px}
.years{list-style:none;margin:18px 0 0;padding:12px 0 0;border-top:1px solid #bfe6ea;font-size:14px}.years li{display:grid;grid-template-columns:48px 1fr;gap:6px;padding:2px 0}.years b{font-weight:500;color:var(--soft)}
.q{font-style:italic;color:var(--soft)}
`, `<div class="room" id="room">
<section class="half d" id="d"><div class="inner"><h2>Divya Tak</h2>${D.map(p => '<p>' + esc(p) + '</p>').join('')}</div></section>
<section class="half k" id="k"><div class="inner"><h2>Kahran Singh</h2>${K.map(p => '<p>' + esc(p) + '</p>').join('')}<p class="q">${esc(Q)}</p><ol class="years">${Y.map(([y, t]) => '<li><b>' + esc(y) + '</b><span>' + esc(t) + '</span></li>').join('')}</ol></div></section>
<button class="line" id="line" role="slider" aria-label="Move between Divya and Kahran" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"></button>
</div>`, `
var R=document.getElementById('room'),d=document.getElementById('d'),k=document.getElementById('k'),l=document.getElementById('line');
function set(p){p=Math.max(6,Math.min(94,p));d.style.width=p+'%';k.style.width=(100-p)+'%';l.style.left=p+'%';l.setAttribute('aria-valuenow',Math.round(p));window.__p=p;}
set(50);var drag=false;
l.addEventListener('pointerdown',function(e){drag=true;l.setPointerCapture(e.pointerId);});
l.addEventListener('pointermove',function(e){if(drag){var b=R.getBoundingClientRect();set((e.clientX-b.left)/b.width*100);}});
l.addEventListener('pointerup',function(){drag=false;});
l.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'){set(window.__p-6);e.preventDefault();}if(e.key==='ArrowRight'){set(window.__p+6);e.preventDefault();}});
`));

// ---- B: Take a stone. The J from the live page, made of what we have said about ourselves. Each stone you take is a thing you learn; the letter comes apart as you get to know us.
const stones = [...dSentences.map(t => ({ who: 'd', t })), ...K.map(t => ({ who: 'k', t })), ...Y.map(([y, t]) => ({ who: 'k', t: y + ': ' + t }))];
out('about-b.html', shell('B / Take a stone', `
.wrap{display:grid;grid-template-columns:minmax(280px,1fr) minmax(0,1.15fr);gap:clamp(24px,5vw,72px);min-height:100dvh;padding:clamp(24px,4vw,56px);align-items:start}
.j{position:relative;width:100%;max-width:440px;aspect-ratio:3/4.4;margin:auto}
.st{position:absolute;border:0;padding:0;cursor:pointer;border-radius:44% 56% 52% 48%/54% 46% 56% 44%;transition:transform .5s cubic-bezier(.3,1.5,.5,1),opacity .4s;box-shadow:inset -5px -7px 12px rgba(0,0,0,.14),inset 5px 6px 10px rgba(255,255,255,.55)}
.st:hover{transform:scale(1.12) rotate(6deg)}
.st.gone{transform:translateY(30px) scale(.3);opacity:0;pointer-events:none}
h1{font:700 clamp(1.8rem,4vw,3rem)/1.05 'Space Grotesk';letter-spacing:-.03em;margin:0 0 10px}
.log{margin-top:22px}.log p{border-left:4px solid var(--c);padding:2px 0 2px 14px;animation:in .4s}
@keyframes in{from{opacity:0;transform:translateX(-8px)}}
.count{font-size:13px;color:var(--soft)}
@media(max-width:760px){.wrap{grid-template-columns:1fr}.j{max-width:240px}}
`, `<div class="wrap"><div class="j" id="j" aria-label="A J made of stones"></div>
<div><h1>Take a stone.</h1><p class="count" id="count"></p><div class="log" id="log" aria-live="polite"></div></div></div>`, `
var S=${JSON.stringify(stones)};
var C={d:['#f25aa3','#7d55d4'],k:['#2fc0d8','#f5c63c']};
// the J, as cells on a 5 by 8 board: the stem, the hook, the top bar
var cells=[];[[1,0],[2,0],[3,0],[4,0],[3,1],[3,2],[3,3],[3,4],[3,5],[3,6],[2,7],[1,7],[0,6],[0,5],[2,1],[2,2],[2,3],[2,4],[2,5],[2,6],[1,6],[4,1],[4,2],[4,3],[4,4],[4,5],[4,6],[3,7],[0,4],[1,1],[1,5],[4,7]].forEach(function(c){cells.push(c);});
var J=document.getElementById('j'),log=document.getElementById('log'),cnt=document.getElementById('count'),left=S.length;
function say(){cnt.textContent=left?left+' stones left. Each one is something true about us.':'That is everything. Now you know us.';}
var seed=7;function r(){seed=(seed*16807)%2147483647;return seed/2147483647;}
S.forEach(function(s,i){var c=cells[i%cells.length],b=document.createElement('button');b.className='st';var sz=19+r()*5;
b.style.cssText='left:'+(c[0]*19.2+r()*3)+'%;top:'+(c[1]*12.1+r()*2)+'%;width:'+sz+'%;height:'+(sz*.72)+'%;background:'+C[s.who][i%2];
b.setAttribute('aria-label',(s.who==='d'?'A stone from Divya':'A stone from Kahran'));
b.dataset.i=i;b.addEventListener('click',function(){b.classList.add('gone');left--;var p=document.createElement('p');p.style.setProperty('--c',C[s.who][i%2]);p.textContent=s.t;log.insertBefore(p,log.firstChild);say();});J.appendChild(b);});
say();
`));

// ---- C: The braid. Two lives on one timeline, running apart, meeting at Joyus, going on together. Her dates come from her own sentences; his from his years.
const divyaDated = [
  { y: 2018, t: dSentences.find(s => s.includes('cover illustrations')) },
  { y: 2025, t: dSentences.find(s => s.includes('Boulder')) },
  { y: 2025.4, t: dSentences.find(s => s.includes('Jugnuma')) },
  { y: 2025.8, t: dSentences.find(s => s.includes('Pollinator')) },
];
out('about-c.html', shell('C / The braid', `
.top{padding:clamp(28px,5vw,64px) clamp(20px,5vw,64px) 18px;max-width:880px}
h1{font:700 clamp(1.8rem,4vw,3rem)/1.05 'Space Grotesk';letter-spacing:-.03em;margin:0 0 8px}
.t{position:relative;display:grid;grid-template-columns:1fr 64px 1fr;padding:0 clamp(12px,4vw,48px) 80px;max-width:1100px;margin:auto}
.row{display:contents}
.d,.k{padding:10px 14px;font-size:15px;line-height:1.45}
.d{text-align:right;grid-column:1}.k{grid-column:3}
.y{grid-column:2;text-align:center;font:500 12px ui-monospace,Consolas,monospace;color:var(--soft);padding-top:13px;position:relative;z-index:1}
.y span{background:#fff;padding:2px 4px}
.meet{grid-column:1/-1;text-align:center;padding:26px 10px;position:relative;z-index:1}
.meet b{display:inline-block;background:var(--ink);color:#fff;padding:9px 18px;border-radius:999px;font-weight:500}
svg{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}
@media(max-width:640px){.d,.k{font-size:13.5px;padding:8px 6px}.t{grid-template-columns:1fr 40px 1fr;padding:0 8px 60px}}
`, `<div class="top"><h1>Two lines, one studio.</h1></div>
<div class="t" id="t"><svg id="sv" aria-hidden="true"></svg>${(() => {
    const rows = [];
    const yrs = Y.filter(([y]) => /^\d/.test(y)).map(([y, t]) => ({ y: +y, t })).reverse();
    const before = yrs.filter(r => r.y < 2022), joy = yrs.find(r => r.y === 2022), after = yrs.filter(r => r.y > 2022);
    const dBefore = divyaDated.filter(r => r.y < 2022), dAfter = divyaDated.filter(r => r.y >= 2022);
    const years = [...new Set([...before.map(r => r.y), ...dBefore.map(r => r.y)])].sort((a, b) => a - b);
    for (const y of years) {
      const k = before.find(r => r.y === y), d = dBefore.find(r => r.y === y);
      rows.push('<div class="row"><div class="d" data-s="d">' + (d ? esc(d.t) : '') + '</div><div class="y"><span>' + y + '</span></div><div class="k" data-s="k">' + (k ? esc(k.t) : '') + '</div></div>');
    }
    rows.push('<div class="meet" id="meet"><b>' + esc(joy.t) + '</b></div>');
    const later = [...new Set([...after.map(r => r.y), ...dAfter.map(r => Math.floor(r.y))])].sort((a, b) => a - b);
    for (const y of later) {
      const k = after.find(r => r.y === y), ds = dAfter.filter(r => Math.floor(r.y) === y);
      rows.push('<div class="row"><div class="d" data-s="d">' + ds.map(d => esc(d.t)).join('<br><br>') + '</div><div class="y"><span>' + y + '</span></div><div class="k" data-s="k">' + (k ? esc(k.t) : '') + '</div></div>');
    }
    const now = Y.find(([y]) => y === 'now');
    rows.push('<div class="row"><div class="d"></div><div class="y"><span>now</span></div><div class="k">' + esc(now[1]) + '</div></div>');
    return rows.join('');
  })()}</div>`, `
function draw(){var t=document.getElementById('t'),sv=document.getElementById('sv'),b=t.getBoundingClientRect(),m=document.getElementById('meet').getBoundingClientRect();
var cx=b.width/2,w=Math.min(b.width*.018,24),my=m.top-b.top+m.height/2,h=b.height;sv.setAttribute('viewBox','0 0 '+b.width+' '+h);
function p(a){return 'M'+(cx+a*w)+' 0 C'+(cx+a*w)+' '+(my*.55)+' '+cx+' '+(my*.7)+' '+cx+' '+my+' C'+cx+' '+(my+(h-my)*.25)+' '+(cx-a*22)+' '+(my+(h-my)*.4)+' '+(cx-a*7)+' '+h;}
sv.innerHTML='<path d="'+p(-1)+'" fill="none" stroke="#E91E7B" stroke-width="4"/><path d="'+p(1)+'" fill="none" stroke="#4FC4CF" stroke-width="4"/>';}
draw();addEventListener('resize',draw);document.fonts&&document.fonts.ready.then(draw);
`));

// ---- D: Four choices. The Line Before's own rule, turned on us: choose between two poles, four times, and you get an About nobody else got. Pole words are drafts, for Kahran.
const POLES = [
  ['Start with what we make', 'Start with who we are', 0, 1],
  ['How it looks', 'How it reads', 2, 3],
  ['What came first', 'What came after', 4, 5],
  ['Keep it short', 'Tell me everything', 6, 7],
];
const POOL = [{ w: 'Divya', t: D[0] }, { w: 'Kahran', t: K[1] }, { w: 'Divya', t: dSentences.find(s => s.includes('comic Common')) }, { w: 'Kahran', t: K[3] }, { w: 'Divya', t: dSentences.find(s => s.includes('Boulder')) }, { w: 'Kahran', t: K[2] }, { w: 'Kahran', t: Q }, { w: 'Divya', t: D[1] }];
out('about-d.html', shell('D / Four choices', `
main{max-width:760px;margin:auto;padding:clamp(28px,6vw,72px) clamp(20px,5vw,40px)}
h1{font:700 clamp(1.8rem,5vw,3.2rem)/1.05 'Space Grotesk';letter-spacing:-.03em;margin:0 0 10px}
.pair{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;margin:28px 0}
.pair button{padding:20px 16px;border:2px solid var(--ink);background:#fff;border-radius:16px;cursor:pointer;font-weight:500;min-height:88px;transition:background .15s,transform .15s}
.pair button:hover{background:#fff4c9;transform:translateY(-2px)}.or{color:var(--fade);font-size:14px}
.got p{border-left:4px solid var(--c);padding:2px 0 2px 16px}.got small{display:block;color:var(--soft);font-size:12px;margin-bottom:4px}
.dots{display:flex;gap:6px;margin-top:6px}.dots i{width:12px;height:12px;border-radius:50%;border:2px solid var(--ink)}.dots i.on{background:var(--ink)}
.end{margin-top:26px;padding:18px;border-radius:16px;background:#f4f5f7}.end button{border:0;background:none;text-decoration:underline;cursor:pointer;padding:6px 0;min-height:44px}
@media(max-width:560px){.pair{grid-template-columns:1fr}.or{text-align:center}}
`, `<main><h1>Meet us your way.</h1><p class="hint">Four choices make an About.</p><div class="dots" id="dots"></div><div id="ask"></div><div class="got" id="got" aria-live="polite"></div><div id="end"></div></main>`, `
var P=${JSON.stringify(POLES)},W=${JSON.stringify(POOL)},n=0;
var ask=document.getElementById('ask'),got=document.getElementById('got'),end=document.getElementById('end'),dots=document.getElementById('dots');
function dotsDraw(){dots.innerHTML=P.map(function(_,i){return '<i class="'+(i<n?'on':'')+'"></i>';}).join('');}
function show(){dotsDraw();if(n>=P.length){ask.innerHTML='';end.innerHTML='<div class="end"><p>That is your About. Nobody else has quite this one.</p><button id="again" type="button">Choose again</button></div>';document.getElementById('again').onclick=function(){n=0;got.innerHTML='';end.innerHTML='';show();};return;}
var q=P[n];ask.innerHTML='<div class="pair"><button type="button" data-w="'+q[2]+'">'+q[0]+'</button><span class="or">or</span><button type="button" data-w="'+q[3]+'">'+q[1]+'</button></div>';
ask.querySelectorAll('button').forEach(function(b){b.onclick=function(){var w=W[+b.dataset.w],e=document.createElement('div');e.innerHTML='<small>'+w.w+'</small>';var p=document.createElement('p');p.textContent=w.t;p.style.setProperty('--c',w.w==='Divya'?'#E91E7B':'#4FC4CF');e.appendChild(p);got.appendChild(e);n++;show();};});}
show();
`));
console.log('four ideas written');
