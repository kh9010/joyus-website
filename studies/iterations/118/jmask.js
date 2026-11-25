// A J as a shape to fill: which pixels are inside it, and how far each pixel is from its edge.
import { edt } from './dist.js';
export function loadMask(name, M) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => {
      const cv = document.createElement('canvas'); cv.width = cv.height = M;
      const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, M, M);
      const d = x.getImageData(0, 0, M, M).data, bin = new Uint8Array(M * M), inv = new Uint8Array(M * M);
      for (let i = 0; i < M * M; i++) { bin[i] = d[i * 4 + 3] > 127 ? 1 : 0; inv[i] = 1 - bin[i]; }
      const a = edt(bin, M, M), b = edt(inv, M, M), raw = new Float32Array(M * M), sd = new Float32Array(M * M);
      for (let i = 0; i < M * M; i++) raw[i] = bin[i] ? a[i] - .5 : -(b[i] - .5);
      // the mask is on or off at each pixel, so its edge is a staircase; averaging with the neighbours takes the steps out
      for (let y = 0; y < M; y++) for (let x2 = 0; x2 < M; x2++) { let t = 0, n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x2 + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < M && yy < M) { t += raw[yy * M + xx]; n++; } } sd[y * M + x2] = t / n; }
      res({ name, M, bin, inside: a, sd });   // inside: pixels to the edge, 0 outside; sd: signed, in pixels of the mask
    };
    im.onerror = rej; im.src = 'masks/' + name + '.png';
  });
}
export const COLOURS = ['#f25aa3', '#7d55d4', '#2fc0d8', '#f5c63c'];
export const INK = '#2C3544';
export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
