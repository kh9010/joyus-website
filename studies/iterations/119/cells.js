// The stones' rule, for interface elements. A box is shared by pieces. Each piece asks for a share of it; a power
// diagram (the J's Voronoi, with a weight per piece) gives every piece its shape, so pieces never overlap and never
// leave a hole: when one takes room, its neighbours give it. Everything moves on springs, so it settles like the
// gummy stones do. Rules kept from the brand lab: one gap everywhere, corners rounded in proportion to the piece.
const NS = 'http://www.w3.org/2000/svg';
let uid = 0;
const TINY = .0005;

export class Cells {
  constructor(el, items, o = {}) {
    this.el = el; this.o = Object.assign({ gap: 7, hover: 1.35, font: 16, onClick: null }, o);
    this.items = []; this.hoverId = null; this.resting = false; this.raf = 0; this.last = 0;
    el.classList.add('cells');
    this.svg = document.createElementNS(NS, 'svg'); el.appendChild(this.svg);
    const id = 'sheen' + (++uid);
    this.svg.innerHTML = '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".26"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".1"/></linearGradient></defs>';
    this.sheen = 'url(#' + id + ')';
    this.lab = document.createElement('div'); this.lab.className = 'cells-labels'; el.appendChild(this.lab);
    items.forEach(it => this.add(it, true));
    this.size(); this.solve(true);
    new ResizeObserver(() => { const w = this.W, h = this.H; this.size(); if (w !== this.W || h !== this.H) this.solve(this.o.snapOnResize); }).observe(el);
  }
  size() { this.W = this.el.clientWidth; this.H = this.el.clientHeight; this.svg.setAttribute('viewBox', '0 0 ' + this.W + ' ' + this.H); }
  get(id) { return this.items.find(n => n.id === id); }
  add(it, quiet) {
    const n = Object.assign({ share: 1, fill: '#eceff3', ink: '#2C3544', at: null, x: null, y: null, w: 0, vx: 0, vy: 0, vw: 0, p: 1, vp: 0, press: 1 }, it);
    n.label_ = it.label != null ? it.label : it.id;
    n.g = document.createElementNS(NS, 'g'); n.base = document.createElementNS(NS, 'path'); n.top = document.createElementNS(NS, 'path'); n.top.setAttribute('fill', this.sheen); n.top.style.pointerEvents = 'none';
    n.g.append(n.base, n.top); this.svg.appendChild(n.g);
    n.label = document.createElement('div'); this.lab.appendChild(n.label); this.text(n);
    n.base.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') this.hover(n.id); });
    n.base.addEventListener('pointerleave', () => { if (this.hoverId === n.id) this.hover(null); n.press = 1; this.wake(); });
    n.base.addEventListener('pointerdown', () => { n.press = .93; this.wake(); });
    n.base.addEventListener('pointerup', () => { n.press = 1; this.wake(); });
    n.base.addEventListener('click', () => this.o.onClick && this.o.onClick(n, this));
    n.base.style.cursor = n.inert ? 'default' : 'pointer';
    this.items.push(n); if (!quiet) this.solve(); return n;
  }
  text(n) { if (n.node) { if (n.label.firstChild !== n.node) n.label.replaceChildren(n.node); } else n.label.innerHTML = '<b>' + n.label_ + '</b>' + (n.sub ? '<small>' + n.sub + '</small>' : ''); }
  remove(id) { const n = this.get(id); if (!n || n.leaving) return; n.leaving = true; n.share = TINY; this.solve(); setTimeout(() => { n.g.remove(); n.label.remove(); this.items = this.items.filter(x => x !== n); this.solve(); }, 420); }
  hover(id) { if (this.hoverId === id) return; this.hoverId = id; this.solve(); }
  update(fn) { fn(this); this.items.forEach(n => { n.label_ = n.label_ ?? n.id; this.text(n); n.base.style.cursor = n.inert ? 'default' : 'pointer'; }); this.solve(); }

  /* where every piece should be: sizes asked for, on a coarse grid (the same solver as the J's stones) */
  solve(snap) {
    const W = this.W, H = this.H, n = this.items.length; if (!n || !W || !H) return;
    const raw = this.items.map(it => Math.max(TINY, it.share) * (it.id === this.hoverId && !it.inert && it.share > TINY ? this.o.hover : 1)), sum = raw.reduce((a, b) => a + b, 0);
    const g = Math.max(2, Math.sqrt(W * H / 2200)), gw = Math.ceil(W / g), gh = Math.ceil(H / g), cell = g * g, total = gw * gh * cell, want = raw.map(r => r / sum * total);
    const sx = [], sy = [], w = [];
    this.items.forEach((it, i) => {
      if (it.tx == null) { const a = it.at || [(i + .5) / n, i % 2 ? .36 : .64]; it.tx = a[0] * W; it.ty = a[1] * H; it.tw = 0; }
      sx[i] = Math.max(1, Math.min(W - 1, it.tx)); sy[i] = Math.max(1, Math.min(H - 1, it.ty)); w[i] = it.tw;
    });
    const area = new Float64Array(n), cx = new Float64Array(n), cy = new Float64Array(n);
    for (let r = 0; r < 60; r++) {
      area.fill(0); cx.fill(0); cy.fill(0);
      for (let j = 0; j < gh; j++) { const y = (j + .5) * g; for (let i = 0; i < gw; i++) { const x = (i + .5) * g; let b = 0, bv = Infinity; for (let s = 0; s < n; s++) { const dx = x - sx[s], dy = y - sy[s], v = dx * dx + dy * dy - w[s]; if (v < bv) { bv = v; b = s; } } area[b] += cell; cx[b] += x; cy[b] += y; } }
      for (let s = 0; s < n; s++) {
        if (area[s] > 0) { const lean = (this.items[s].lean || 0) * Math.min(1, W / (n * H * 1.5)); sx[s] += (cx[s] / (area[s] / cell) - sx[s]) * .7; sy[s] += (Math.max(2, Math.min(H - 2, cy[s] / (area[s] / cell) + lean * H)) - sy[s]) * .7; w[s] += .6 * (want[s] - area[s]) / Math.PI; }
        else if (want[s] > cell * 2) w[s] += want[s] / Math.PI;
      }
    }
    const m = Math.max(...w);   // only differences between weights matter; keep them near zero so the springs stay calm
    this.items.forEach((it, i) => { it.tx = sx[i]; it.ty = sy[i]; it.tw = w[i] - m; if (snap || it.x == null) { if (it.x == null && !snap) { it.x = it.tx; it.y = it.ty; it.w = it.tw - Math.max(want[i], 2000); } else { it.x = it.tx; it.y = it.ty; it.w = it.tw; } it.vx = it.vy = it.vw = 0; } });
    this.wake();
  }
  wake() { this.resting = false; if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(t => this.tick(t)); } }
  tick(t) {
    this.raf = 0; let dt = Math.min(.032, (t - this.last) / 1000); this.last = t; let energy = 0;
    const K = 150, C = 17;
    for (let step = 0; step < 2; step++) for (const it of this.items) {
      for (const [k, v, tgt, scale] of [['x', 'vx', it.tx, 1], ['y', 'vy', it.ty, 1], ['w', 'vw', it.tw, .02], ['p', 'vp', it.press, 300]]) {
        it[v] += ((tgt - it[k]) * K - it[v] * C) * dt / 2; it[k] += it[v] * dt / 2; energy += Math.abs(tgt - it[k]) * scale + Math.abs(it[v]) * scale * .05;
      }
    }
    this.draw();
    if (energy < .15) { this.items.forEach(it => { it.x = it.tx; it.y = it.ty; it.w = it.tw; it.p = it.press; it.vx = it.vy = it.vw = it.vp = 0; }); this.draw(); this.resting = true; } else this.raf = requestAnimationFrame(t2 => this.tick(t2));
  }
  /* the shape of each piece right now: the box, cut by its border with every other piece */
  poly(i) {
    const a = this.items[i]; let P = [[0, 0], [this.W, 0], [this.W, this.H], [0, this.H]];
    for (let j = 0; j < this.items.length && P.length; j++) {
      if (j === i) continue; const b = this.items[j], nx = 2 * (b.x - a.x), ny = 2 * (b.y - a.y), lim = b.x * b.x + b.y * b.y - a.x * a.x - a.y * a.y - b.w + a.w, Q = [];
      for (let k = 0; k < P.length; k++) { const p = P[k], q = P[(k + 1) % P.length], dp = nx * p[0] + ny * p[1] - lim, dq = nx * q[0] + ny * q[1] - lim; if (dp <= 0) Q.push(p); if ((dp < 0 && dq > 0) || (dp > 0 && dq < 0)) { const t = dp / (dp - dq); Q.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); } }
      P = Q;
    }
    return P;
  }
  draw() {
    const half = this.o.gap / 2;
    this.items.forEach((it, i) => {
      let P = this.poly(i).filter((p, k, A) => { const q = A[(k + 1) % A.length]; return Math.hypot(p[0] - q[0], p[1] - q[1]) > .6; });
      it.area = 0; it.shown = false;
      if (P.length >= 3) {
        // pull every edge in by half a gap: cut the shape by each of its own edges moved inward (a thin piece loses edges, it never turns inside out)
        let sgn = 0; for (let k = 0; k < P.length; k++) { const p = P[k], q = P[(k + 1) % P.length]; sgn += p[0] * q[1] - q[0] * p[1]; }
        const s = sgn > 0 ? 1 : -1; let I = P.slice();
        for (let k = 0; k < P.length && I.length >= 3; k++) {
          const p = P[k], q = P[(k + 1) % P.length], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy), nx = -dy / l * s, ny = dx / l * s, lim = nx * p[0] + ny * p[1] + half, Q = [];
          for (let m = 0; m < I.length; m++) { const a = I[m], b = I[(m + 1) % I.length], da = nx * a[0] + ny * a[1] - lim, db = nx * b[0] + ny * b[1] - lim; if (da >= 0) Q.push(a); if ((da > 0 && db < 0) || (da < 0 && db > 0)) { const t = da / (da - db); Q.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } }
          I = Q;
        }
        I = I.filter((a, m, A) => { const b = A[(m + 1) % A.length]; return Math.hypot(a[0] - b[0], a[1] - b[1]) > .6; });
        const n = I.length; let ok = n >= 3, ar = 0, mx = 0, my = 0, x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
        for (let k = 0; k < n; k++) { const p = I[(k + n - 1) % n], q = I[k]; const c = p[0] * q[1] - q[0] * p[1]; ar += c; mx += (p[0] + q[0]) * c; my += (p[1] + q[1]) * c; x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
        if (ok && Math.abs(ar) / 2 > 60) {
          it.area = Math.abs(ar) / 2; it.cx = mx / (3 * ar); it.cy = my / (3 * ar); it.bw = x1 - x0; it.bh = y1 - y0; it.shown = true;
          const R = Math.max(4, Math.min(30, .17 * Math.sqrt(it.area))); let d = '';
          for (let k = 0; k < n; k++) { const p = I[(k + n - 1) % n], q = I[k], r2 = I[(k + 1) % n], l1 = Math.hypot(q[0] - p[0], q[1] - p[1]), l2 = Math.hypot(r2[0] - q[0], r2[1] - q[1]), r = Math.min(R, l1 * .45, l2 * .45); const ax = q[0] + (p[0] - q[0]) / l1 * r, ay = q[1] + (p[1] - q[1]) / l1 * r, bx = q[0] + (r2[0] - q[0]) / l2 * r, by = q[1] + (r2[1] - q[1]) / l2 * r; d += (k ? 'L' : 'M') + ax.toFixed(1) + ' ' + ay.toFixed(1) + 'Q' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) + ' ' + bx.toFixed(1) + ' ' + by.toFixed(1); }
          d += 'Z'; it.base.setAttribute('d', d); it.top.setAttribute('d', d); it.base.setAttribute('fill', it.fill);
          it.g.setAttribute('transform', 'translate(' + it.cx.toFixed(1) + ' ' + it.cy.toFixed(1) + ') scale(' + it.p.toFixed(3) + ') translate(' + (-it.cx).toFixed(1) + ' ' + (-it.cy).toFixed(1) + ')');
        }
      }
      it.g.style.display = it.shown ? '' : 'none';
      const l = it.label; l.style.color = it.ink; l.style.fontSize = (it.font || this.o.font) + 'px';
      if (!it.shown) { l.classList.remove('on'); it.labelOn = false; return; }
      l.style.left = it.cx + 'px'; l.style.top = it.cy + 'px';
      if (it.node) l.style.width = Math.max(90, Math.min(300, it.bw * .62)) + 'px';
      l.classList.toggle('wide', it.area > (it.subArea ?? 9000));
      const want = it.font || this.o.font; it.labelOn = false;
      for (const f of it.node ? [want] : [want, Math.max(13, want - 2), 13]) { l.style.fontSize = f + 'px'; if (!it.node) l.style.maxWidth = Math.max(40, it.bw * .8) + 'px'; const lw = l.offsetWidth, lh = l.offsetHeight; if (lw <= it.bw * .86 && lh <= it.bh * .82 && lw * lh <= it.area * .62) { it.labelOn = true; break; } }
      l.classList.toggle('on', it.labelOn);
    });
  }
  measure() { const total = this.W * this.H; return { box: [this.W, this.H], resting: this.resting, hover: this.hoverId, pieces: this.items.map(it => ({ id: it.id, share: +(it.area / total).toFixed(4), shown: it.shown, label: it.labelOn ? it.label.textContent : '', font: it.labelOn ? parseFloat(getComputedStyle(it.label).fontSize) : null, fill: it.fill })), covered: +(this.items.reduce((a, it) => a + it.area, 0) / total).toFixed(3) }; }
}
