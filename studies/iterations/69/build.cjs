// Study 69: writes index.html from the copy below and studies.json, so the counts on the page cannot drift from the data.
const fs = require('node:fs');
const path = require('node:path');
const S = JSON.parse(fs.readFileSync(path.join(__dirname, 'studies.json'), 'utf8'));

const pic = (src, alt) => `<a class="zoom" href="${src}"><img src="${src}" alt="${alt}"></a>`;
const CHAIN = [
  { id: 'get', say: 'I get what this is.', have: 'Live: under construction. Study 13 says "We reimagine brand &amp; identity" over a blank description. On 26 Oct you said there is no quick version.', src: '31 Aug: clear within seconds', pics: [pic('shots/first-live.png', 'The first screen of joyus.studio today'), pic('shots/first-13.png', 'The first screen of the Study 13 one page')] },
  { id: 'me', say: 'That\'s my situation.', have: 'No page names a situation. All the Work lines open with what we did: "For Klydo, we built..."', src: '20 Jul: how to show the cast stayed open', pics: [] },
  { id: 'cost', say: 'Waiting is costing me.', have: 'Nothing. We get filed under "when I have time". It may belong in the call, and it pulls against "wonder instead of dread".', src: '23 Oct: an investor, on the cost of doing nothing', pics: [] },
  { id: 'done', say: 'They\'ve done it before.', have: 'Most of the work. 40 items on the tree, none finished; Secret Senses is the first with a concept.', src: '23 Oct: case studies are the best proof', pics: [pic('../68/shots/gather-2.png', 'Secret Senses, the motifs gather')] },
  { id: 'see', say: 'They\'d see what I can\'t.', have: 'EWC: they came for a website, the unlock was six personas. Secret Senses shows the hand, not a finding. Careful: on 23 Oct you said this is also what threatens people.', src: '31 Aug: strategy has no self-evident artifact', pics: [pic('../50/img/with-50-1440.png', 'EWC, six Tuesdays').replace('<img ', '<img class="whole" ')] },
  { id: 'two', say: 'I want those two in the room.', have: 'The trail. Strong, but the words are still two separate Abouts.', src: '26 Jun: take space before the pitch', pics: [pic('../67/img/b-trail.png', 'About, the trail').replace('<img ', '<img class="low" ')] },
  { id: 'step', say: 'I know what happens if I write.', have: 'The line is blank; the form sends nothing. 11 Sep: no services, let the work speak. 26 Oct: people don\'t know what to buy. These disagree.', src: '26 Oct: a small paid session, on no page', pics: [pic('../10/img/sayhi-b-from.png', 'Say hi, Study 10')] }
];
const ANSWERS = [
  ['8 May', 'Reflective founders, creative systems builders, leaders in transition'],
  ['20 Jul', 'Anyone at an inflection with enough at stake; a cast of four'],
  ['31 Aug', 'Neither of you could say'],
  ['11 Sep', 'Someone who has been wanting to make a thing; institutions as the dream'],
  ['18 Sep', 'Professional visitors, surprised by the range'],
  ['26 Oct', 'Founders and creatives missing one piece (your rewording of Boardy\'s line)'],
  ['2 Nov', 'Nobody named. The tree assumes someone browsing 40 items (my reading)']
];
const BETS = [
  ['Founder, sent by someone they trust', 'The page confirms what the friend said', 'Yes: high trust gets past the hump', 'EWC, the trail', true],
  ['Creative with a practice, sent the same way', 'I can look the way I see myself', 'Billed: Rachna, at an artist\'s rate', 'Secret Senses, comics, poetry', true],
  ['Whoever is browsing', 'They know what they want when they see it', 'Your 26 Oct call says no', 'The tree, the logos', false],
  ['Institution commissioning art and tech', 'They have shown real work in real rooms', 'Not yet; shown in Boulder', 'Perpetuity, The Line Before, Metro Museum', false],
  ['Wealthy person at a turning point', 'A week with us is worth it', 'Not yet', 'Nothing', false]
];

const dots = n => '<span class="dots">' + Array(n).fill('<i></i>').join('') + '</span>';
const count = id => S[id].length;
const row = (c, i) => {
  const n = count(c.id), hole = n === 0;
  return `<section class="link${hole ? ' hole' : ''}" data-belief="${c.id}" data-n="${n}">
<div class="n">${i + 1}</div>
<div class="say"><h2>${c.say}</h2><p class="tally">${dots(n)}<b>${n}</b> ${n === 1 ? 'study' : 'studies'}</p></div>
<div class="have"><p>${c.have}</p><small>${c.src}</small></div>
<div class="pics pics-${c.pics.length}">${c.pics.join('') || '<div class="none">nothing yet</div>'}</div>
</section>`;
};
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>69 / The bet — Joyus homepage</title>
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap">
<link rel="stylesheet" href="../../study.css">
<style>
.bet{font-size:clamp(22px,2.6vw,32px);line-height:1.25;font-weight:500;max-width:30ch;margin:22px 0 6px}
.mine{color:var(--ink-2);margin:0 0 30px;font-size:13px}
.chain{position:relative;margin:0 0 26px}
.link{display:grid;grid-template-columns:44px minmax(190px,1.1fr) minmax(220px,1.3fr) minmax(0,1.4fr);gap:18px;align-items:start;padding:20px 0;position:relative}
.link+.link{border-top:1px solid var(--line)}
.n{width:30px;height:30px;border:2px solid var(--ink);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px;background:#fff}
.hole .n{border:2px dashed #E91E7B;color:#E91E7B}
.say h2{all:unset;display:block;font-size:20px;line-height:1.2;font-weight:600}
.hole .say h2{color:#E91E7B}
.tally{margin:10px 0 0;font-size:13px;color:var(--ink-2)}
.dots{display:flex;flex-wrap:wrap;gap:3px;margin-bottom:5px;max-width:190px}.dots i{width:9px;height:9px;background:var(--ink)}
.tally b{color:var(--ink)}
.have p{margin:0 0 6px}.have small{color:var(--ink-3);font-size:12px;line-height:1.35;display:block}
.pics{display:grid;gap:8px}.pics-2{grid-template-columns:1fr 1fr}.pics img{width:100%;display:block;border:1px solid var(--line);aspect-ratio:16/10;object-fit:cover;object-position:top}
.pics img.low{object-position:bottom}.pics img.whole{object-fit:contain;background:#f5f5f3}
.none{border:1.5px dashed #E91E7B;color:#E91E7B;aspect-ratio:16/5;display:flex;align-items:center;justify-content:center;font-size:13px}
.outside{display:flex;flex-wrap:wrap;gap:6px 30px;padding:14px 0 0;border-top:1px solid var(--line);color:var(--ink-2);font-size:13px}
.outside .dots{max-width:none}
.said{display:grid;grid-template-columns:70px 1fr;gap:5px 14px;max-width:80ch;margin:0}.said dt{color:var(--ink-3);font-size:13px;padding-top:1px}.said dd{margin:0}
table.bets{width:100%;border-collapse:collapse;font-size:14px}table.bets td,table.bets th{padding:9px 12px 9px 0}table.bets th{font-weight:500;color:var(--ink-3);font-size:12px}
tr.pick td:first-child{font-weight:600}
.pickline{font-size:18px;font-weight:500;max-width:60ch;margin:22px 0 8px}
@media(max-width:820px){.link{grid-template-columns:36px 1fr;gap:10px 10px}.have,.pics{grid-column:2}.scroll{overflow-x:auto}table.bets{min-width:620px}}
</style></head><body><main>
<p class="eyebrow">Study 69 · 3 November 2026</p>
<h1>The bet</h1>
<p class="lede">Who the customer is, and what has to be true for them to buy. All of it has to be true. Your words, held against all 68 studies.</p>
<p class="bet">A founder or creative, sent by someone they trust, missing one piece.</p>
<p class="mine">Your 26 Oct line and the 23 Oct call. They arrive curious; the site gets them to write (11 Sep).</p>
<div class="chain">
${CHAIN.map(row).join('\n')}
<div class="outside" data-outside="${count('sign') + count('setup')}"><span>${dots(count('sign'))}<b>${count('sign')}</b> on the holding page, which is live and made the stones</span><span>${dots(count('setup'))}<b>${count('setup')}</b> setup</span></div>
</div>
<p class="pickline">We say a founder who is stuck. We have built a portfolio for someone already browsing.</p>
<h2>Who we've said it is</h2>
<dl class="said">
${ANSWERS.map(a => `<dt>${a[0]}</dt><dd>${a[1]}</dd>`).join('\n')}
</dl>
<h2>The rival bets</h2>
<div class="scroll"><table class="bets"><tr><th>Who</th><th>What has to be true</th><th>Has it paid?</th><th>What we have for it</th></tr>
${BETS.map(b => `<tr${b[4] ? ' class="pick"' : ''}><td>${b[0]}</td><td>${b[1]}</td><td>${b[2]}</td><td>${b[3]}</td></tr>`).join('\n')}
</table></div>
<p class="mine" style="margin-top:14px">Pick: the first two, as your 26 Oct line does. Only they have sales and your words behind them, and they need different proof: EWC for one, Rachna's site for the other. All of this is my reading of your calls and docs. No buyer was asked: ask the last three who paid what they checked before replying.</p>
</main></body></html>
`;
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('built');
