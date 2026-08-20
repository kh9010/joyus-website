// Fetcher behaviour against a local server. Deterministic, no network.
//
// The 403-recovery path cannot be exercised against the four real sites — the
// one that blocks some crawlers (josephlogan.com) returns 200 to every profile
// in this chain — so the escalation is proven here instead, against a server
// that blocks the first profile on purpose.

import http from 'node:http';
import { describe, ok, eq, report } from './_harness.mjs';
import { fetchOne, CONFIG } from '../src/fetcher.js';

const server = http.createServer((req, res) => {
  const ua = req.headers['user-agent'] || '';
  const url = req.url;

  if (url === '/blocks-chrome') {
    if (/Chrome\/124/.test(ua)) {
      res.writeHead(403, { 'content-type': 'text/html' });
      res.end('<html><body>Forbidden</body></html>');
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end('<html><body><h1>Recovered by escalation</h1></body></html>');
    return;
  }

  if (url === '/blocks-everything') {
    res.writeHead(403, { 'content-type': 'text/html' });
    res.end('<html><body>Forbidden</body></html>');
    return;
  }

  if (url === '/blocks-with-503') {
    if (/Chrome\/124/.test(ua)) {
      res.writeHead(503, { 'content-type': 'text/html' });
      res.end('<html><body>Just a moment...</body></html>');
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end('<html><body><h1>Past the challenge page</h1></body></html>');
    return;
  }

  if (url === '/missing') {
    res.writeHead(404, { 'content-type': 'text/html' });
    res.end('<html><body>Not here</body></html>');
    return;
  }

  if (url.startsWith('/redirect-loop')) {
    res.writeHead(302, { location: `/redirect-loop?n=${Number(new URL(url, 'http://x').searchParams.get('n') || 0) + 1}` });
    res.end();
    return;
  }

  if (url === '/redirect-once') {
    res.writeHead(301, { location: '/landed' });
    res.end();
    return;
  }
  if (url === '/landed') {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end('<html><body><h1>Landed</h1></body></html>');
    return;
  }

  if (url === '/pdf') {
    res.writeHead(200, { 'content-type': 'application/pdf' });
    res.end('%PDF-1.4');
    return;
  }

  if (url === '/huge') {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(`<html><body>${'x'.repeat(CONFIG.MAX_BYTES_PER_PAGE + 50_000)}</body></html>`);
    return;
  }

  res.writeHead(200, { 'content-type': 'text/html' });
  res.end('<html><body><h1>Fine</h1></body></html>');
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

describe('the fetch chain escalates only when blocked');
const escalated = await fetchOne(`${base}/blocks-chrome`);
ok(escalated.ok, 'a 403 on the first profile is recovered by the next one');
ok(escalated.html.includes('Recovered by escalation'), 'the recovered body is the real page');
eq(escalated.attempts.length, 2, 'exactly one escalation was needed');
eq(escalated.attempts[0].blocked, true, 'the first attempt is recorded as blocked');
eq(escalated.attempts[0].status, 403, 'with its status');

const challenge = await fetchOne(`${base}/blocks-with-503`);
ok(challenge.ok, 'a 503 challenge page also escalates rather than giving up');

const clean = await fetchOne(`${base}/fine`);
eq(clean.attempts.length, 1, 'a clean 200 never triggers a second profile');

const missing = await fetchOne(`${base}/missing`);
ok(!missing.ok, 'a 404 is a failure');
eq(missing.attempts.length, 1, 'a 404 is a real answer, not a block — no escalation');
eq(missing.reason, 'HTTP 404', 'the reason names the status');

const walled = await fetchOne(`${base}/blocks-everything`);
ok(!walled.ok, 'a site that blocks every profile fails honestly');
eq(walled.attempts.length, 3, 'every profile in the chain was tried');
ok(walled.attempts.every((a) => a.blocked), 'each attempt is recorded as blocked');

describe('redirects are followed, and the cap is enforced');
const redirected = await fetchOne(`${base}/redirect-once`);
ok(redirected.ok, 'a single redirect is followed');
ok(redirected.html.includes('Landed'), 'the redirect target is what gets read');
ok(redirected.finalUrl.endsWith('/landed'), 'finalUrl is the page actually read', redirected.finalUrl);

const looped = await fetchOne(`${base}/redirect-loop`);
ok(!looped.ok, 'a redirect loop terminates');
eq(looped.reason, 'too many redirects', `the cap of ${CONFIG.REDIRECT_CAP} is a real limit, not a constant`);

describe('content type and byte cap');
const pdf = await fetchOne(`${base}/pdf`);
ok(!pdf.ok, 'a non-HTML content type is refused');
ok(/non-html content-type/.test(pdf.reason), 'and says so');

const huge = await fetchOne(`${base}/huge`);
ok(huge.ok, 'an oversized page still returns');
ok(huge.truncated, 'and is marked truncated');
ok(huge.html.length <= CONFIG.MAX_BYTES_PER_PAGE, `body capped at ${CONFIG.MAX_BYTES_PER_PAGE} bytes (${huge.html.length})`);

server.close();
process.exit(report() > 0 ? 1 : 0);
