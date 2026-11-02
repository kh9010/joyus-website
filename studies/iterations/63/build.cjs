// Study 63: wireframes for About, now that Take a stone A is chosen (Study 61). Grey boxes, real words, working picks.
// One real decision per wireframe: where the stones and the story sit against each other. node build.cjs
const fs = require('node:fs');
const path = require('node:path');
const shell = (title, css, body) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>${title}</title><link rel="icon" href="data:,"><link rel="stylesheet" href="wire.css">
<style>
html,body{margin:0}body{background:#fff}
.stones{display:flex;gap:clamp(10px,3vw,40px);align-items:center;justify-content:center}
.stone{all:unset;box-sizing:border-box;cursor:pointer;display:grid;place-items:center;background:var(--box);border:1.5px dashed var(--line);font:700 var(--sz,clamp(5rem,14vw,11rem))/1 var(--sans);color:var(--mute);aspect-ratio:1;width:var(--w,clamp(110px,18vw,240px));position:relative}
.stone:hover{background:var(--box2)}.stone:focus-visible{outline:3px solid var(--ink);outline-offset:3px}
.stone small{position:absolute;bottom:6px;left:0;right:0;text-align:center;font:400 11px var(--mono);color:var(--mute)}
.stone:disabled,.stone[disabled]{opacity:.4;cursor:default}
.story article{border-left:4px solid var(--ink);padding:1px 0 1px 12px;margin:0 0 12px;font-size:15px;line-height:1.45}
.story article[data-who=K]{border-left-style:dashed}
.story small{display:block;font:11px var(--mono);color:var(--mute)}.story p{margin:1px 0 0}
.note{font:12px var(--mono);color:var(--mute);margin:0 0 8px}
.lab{font:12px var(--mono);color:var(--mute)}
h1{font:500 clamp(1.5rem,3vw,2.3rem)/1.1 var(--sans);letter-spacing:-.02em;margin:0 0 6px}
.bar{height:44px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 var(--x);font:12px var(--mono);color:var(--mute)}
.hi{margin-top:12px;padding:14px;border:1.5px dashed var(--line);background:var(--paper);display:none;font-size:15px}
.hi.on{display:block}
${css}
</style></head><body>
${body}
<script src="wire.js"></script></body></html>
`;
const stones = (extra = '') => `<div class="stones" ${extra}><button class="stone" type="button" data-pick="D">D<small data-left="D"></small></button><button class="stone" type="button" data-pick="K">K<small data-left="K"></small></button></div>`;
const out = (f, s) => fs.writeFileSync(path.join(__dirname, f), s);

// A: Beside. What Study 61 already does: the stones stay; the story runs beside them.
out('wire-a.html', shell('A / Beside', `
.w{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);min-height:100dvh}
.l{position:sticky;top:0;height:100dvh;display:grid;place-items:center;background:var(--paper)}
.r{padding:48px var(--x)}
@media(max-width:760px){.w{grid-template-columns:1fr}.l{position:sticky;height:34dvh;z-index:2;--w:96px;--sz:3.4rem}}
`, `<div class="w"><div class="l">${stones()}</div><div class="r"><h1>Take a stone.</h1><p class="note" data-prompt></p><div class="story" data-story></div><div class="hi" data-end>Say hi →</div></div></div>`));

// B: Stage, then story. The stones are the event; the story collects below, read top to bottom like a page.
out('wire-b.html', shell('B / Stage, then story', `
.stage{position:sticky;top:0;background:var(--paper);padding:clamp(14px,3vh,28px) var(--x);border-bottom:1px solid var(--line);text-align:center;z-index:2;--w:clamp(90px,16vw,190px);--sz:clamp(3rem,10vw,7rem)}
main{max-width:680px;margin:auto;padding:28px var(--x) 80px}
`, `<div class="stage"><h1>Take a stone.</h1>${stones()}</div><main><p class="note" data-prompt></p><div class="story" data-story></div><div class="hi" data-end>Say hi →</div></main>`));

// C: Between them. D on the left, K on the right; each line sits towards whoever said it. It reads as a conversation.
out('wire-c.html', shell('C / Between them', `
.w{display:grid;grid-template-columns:clamp(84px,20vw,260px) minmax(0,1fr) clamp(84px,20vw,260px);min-height:100dvh;--w:clamp(76px,16vw,210px);--sz:clamp(2.8rem,9vw,7rem)}
.side{position:sticky;top:0;height:100dvh;display:grid;place-items:center;background:var(--paper)}
.mid{padding:40px clamp(12px,3vw,40px)}
.story{display:flex;flex-direction:column;gap:2px}
.story article{max-width:82%;border:0;padding:10px 14px;background:var(--paper);margin:0 0 8px}
.story article[data-who=D]{align-self:flex-start;border-left:4px solid var(--ink)}
.story article[data-who=K]{align-self:flex-end;border-right:4px dashed var(--ink)}
h1{text-align:center}.note{text-align:center}
`, `<div class="w"><div class="side"><button class="stone" type="button" data-pick="D">D<small data-left="D"></small></button></div><div class="mid"><h1>Take a stone.</h1><p class="note" data-prompt></p><div class="story" data-story></div><div class="hi" data-end>Say hi →</div></div><div class="side"><button class="stone" type="button" data-pick="K">K<small data-left="K"></small></button></div></div>`));

// D: One line at a time. The stones fill the screen; only what you just took is shown, large. The rest waits in a drawer.
out('wire-d.html', shell('D / One line at a time', `
.w{height:100dvh;display:grid;grid-template-rows:minmax(0,1fr) auto;background:var(--paper);--w:clamp(120px,27vw,400px);--sz:clamp(5rem,20vw,16rem)}
.top{display:grid;place-items:center;position:relative;min-height:0}
.top h1{position:absolute;top:16px;left:var(--x)}
.card{background:#fff;border-top:1.5px solid var(--ink);padding:16px var(--x) 18px;min-height:150px}
.big{font:500 clamp(1.05rem,1.9vw,1.5rem)/1.32 var(--sans);max-width:62ch;margin:0;max-height:24dvh;overflow:auto}
.card small{font:11px var(--mono);color:var(--mute)}
details{margin-top:8px;font-size:14px}summary{cursor:pointer;font:12px var(--mono);color:var(--mute);min-height:30px}
.story{max-height:30dvh;overflow:auto;margin-top:8px}
`, `<div class="w"><div class="top"><h1>Take a stone.</h1>${stones()}</div><div class="card"><small data-latest-who></small><p class="big" data-latest></p><p class="note" data-prompt></p><details><summary>The story so far</summary><div class="story" data-story></div></details><div class="hi" data-end>Say hi →</div></div></div>`));

// E: Inside the one page. The section as it would actually sit: Work above, Say hi below, one screen tall, the story scrolling inside it. Finishing leads to Say hi.
out('wire-e.html', shell('E / Inside the one page', `
.ctx{background:var(--paper);padding:26px var(--x);border-bottom:1px solid var(--line);font:12px var(--mono);color:var(--mute);min-height:170px}
.ctx .gbox{height:110px;margin-top:10px}
.about{height:min(100dvh,760px);display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);border-bottom:1px solid var(--line);--w:clamp(100px,15vw,200px);--sz:clamp(3.4rem,9vw,7rem)}
.about .l{display:grid;place-items:center;background:#fff;border-right:1px solid var(--line);padding:12px}
.about .r{display:flex;flex-direction:column;min-height:0;padding:24px var(--x)}
.about .story{overflow:auto;flex:1;min-height:0}
#hi{padding:40px var(--x);background:var(--paper);min-height:220px}
.gfield{height:40px;border:1px solid var(--line);margin:8px 0;max-width:520px;background:#fff}
@media(max-width:760px){.about{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr);--w:88px;--sz:3rem}.about .l{border-right:0;border-bottom:1px solid var(--line)}}
`, `<div class="bar"><span>wordmark</span><span>work · about · say hi</span></div>
<section class="ctx">Work, above<div class="gbox"></div></section>
<section class="about" id="about"><div class="l">${stones()}</div><div class="r"><h1>Take a stone.</h1><p class="note" data-prompt></p><div class="story" data-story></div><div class="hi" data-end><a href="#hi">You have met us. Say hi ↓</a></div></div></section>
<section id="hi"><h1>Say hi</h1><div class="gfield"></div><div class="gfield"></div></section>`));
console.log('five wireframes');
