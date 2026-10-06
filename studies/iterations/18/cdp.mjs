// A headless Chrome over the DevTools protocol, for bake.mjs and shoot.mjs.
// WebGL runs on SwiftShader (CPU), so these never touch Divya's GPU.
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export async function chrome() {
  const port = 9500 + Math.floor(Math.random() * 400);
  const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    // keep analytics/fonts honest: no GA hits from a test run
    '--host-resolver-rules=MAP www.googletagmanager.com 0.0.0.0, MAP *.google-analytics.com 0.0.0.0',
    `--remote-debugging-port=${port}`, `--user-data-dir=${path.join(os.tmpdir(), 'joy16-' + port)}`, 'about:blank'], { stdio: 'ignore' });
  let target;
  for (let i = 0; i < 60 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch {} }
  if (!target) { proc.kill(); throw new Error('Chrome did not start'); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = new Map(); const errors = []; let loaded = null;
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.method === 'Page.loadEventFired' && loaded) loaded();
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value ?? a.description).join(' '));
    if (pending.has(m.id)) { pending.get(m.id)(m.result || m.error); pending.delete(m.id); }
  });
  const send = (method, params = {}) => new Promise(r => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');
  const api = {
    send, errors,
    evaluate: async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; },
    async visit(url, width = 1440, height = 900) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 });
      const done = new Promise(r => { loaded = r; });
      await send('Page.navigate', { url });
      await done;
    },
    async waitFor(expr, ms = 30000) {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) { if (await api.evaluate(expr)) return true; await sleep(100); }
      throw new Error('timed out waiting for ' + expr);
    },
    async shot(file) { const { data } = await send('Page.captureScreenshot', { format: 'png' }); (await import('node:fs')).writeFileSync(file, Buffer.from(data, 'base64')); },
    close() { ws.close(); proc.kill(); },
  };
  return api;
}
