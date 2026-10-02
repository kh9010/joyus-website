// Checks the homepage studies hold together: every rail entry resolves and
// the rail opens the newest; every local file a study references exists;
// every study is numbered to its folder and kept out of search (the repo is
// public, so studies/ deploys if this branch merges); screenshots are real
// PNGs; Study 02's round 4 is still byte-identical to the commit it records;
// and no older study has been edited since it was committed (snapshot rule).
// Run with the server up for the HTTP check; the file checks run either way.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawnSync } = require('node:child_process');
const here = __dirname;
const repo = path.resolve(here, '..');
let failures = 0;
const ok = (msg) => console.log('  ok   ' + msg);
const fail = (msg) => { failures++; console.log('  FAIL ' + msg); };
const read = (p) => fs.readFileSync(path.join(here, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(here, p));
const git = (...args) => spawnSync('git', args, { cwd: repo, encoding: 'buffer' });

// 1. rail
console.log('rail');
const rail = read('index.html');
const entries = [...rail.matchAll(/href="(iterations\/(\d\d)\/index\.html)"/g)].map(m => ({ file: m[1], n: m[2] }));
if (!entries.length) fail('no rail entries');
for (const e of entries) exists(e.file) ? ok(e.file) : fail(e.file + ' missing');
const nums = entries.map(e => +e.n);
nums.every((n, i) => i === 0 || n === nums[i - 1] - 1) && nums[nums.length - 1] === 1 ? ok('rail runs newest to 01 with no gaps') : fail('rail order ' + nums.join(','));
const iframeSrc = (rail.match(/<iframe[^>]*src="([^"]+)"/) || [])[1];
entries[0] && entries[0].file === iframeSrc ? ok('iframe opens the newest study (' + iframeSrc + ')') : fail('iframe src ' + iframeSrc + ' is not the newest rail entry');
const folders = fs.readdirSync(path.join(here, 'iterations')).filter(d => /^\d\d$/.test(d));
const unlisted = folders.filter(d => !entries.some(e => e.n === d));
unlisted.length ? fail('study folders not on the rail: ' + unlisted.join(', ')) : ok('every study folder is on the rail');
/noindex/.test(rail) ? ok('rail is noindex') : fail('rail has no noindex');

// 2. each study
console.log('studies');
for (const e of entries) {
  const dir = path.dirname(e.file);
  const html = read(e.file);
  new RegExp('class="eyebrow">Study ' + e.n + ' ').test(html) ? ok(e.file + ' is numbered Study ' + e.n) : fail(e.file + ' eyebrow does not say Study ' + e.n);
  /<meta name="robots" content="noindex/.test(html) ? ok(e.file + ' is noindex') : fail(e.file + ' has no noindex');
  const refs = [...html.matchAll(/(?:src|href)="([^"#?]+)"/g)].map(m => m[1]).filter(r => !/^(https?:|mailto:|data:|\/\/)/.test(r) && !r.includes('${'));
  let bad = 0;
  for (const r of refs) {
    const target = path.normalize(path.join(dir, r));
    if (!exists(target)) { bad++; fail(e.file + ' references missing ' + r); }
  }
  if (!bad) ok(e.file + ' (' + refs.length + ' local references resolve)');
}

// 2b. a study that ships its own check (iterations/NN/check.cjs) must pass it
console.log('study checks');
for (const d of folders) {
  const c = path.join(here, 'iterations', d, 'check.cjs');
  if (!fs.existsSync(c)) continue;
  const r = spawnSync(process.execPath, [c], { encoding: 'utf8' });
  r.status === 0 ? ok(d + '/check.cjs passes') : fail(d + '/check.cjs:\n' + r.stdout);
}

// 3. screenshots are real PNGs
console.log('images');
let imgs = 0, badImgs = 0;
for (const d of folders) {
  const imgDir = path.join(here, 'iterations', d, 'img');
  if (!fs.existsSync(imgDir)) continue;
  for (const f of fs.readdirSync(imgDir)) {
    const buf = fs.readFileSync(path.join(imgDir, f));
    imgs++;
    // PNG (wireframe screenshots) or JPEG (reference captures of other sites, Studies 14–15)
    const sig = buf.subarray(0, 4).toString('hex');
    if (!(sig === '89504e47' || sig.startsWith('ffd8')) || buf.length < 5000) { badImgs++; fail(d + '/img/' + f + ' is not a real PNG/JPEG (' + buf.length + ' bytes)'); }
  }
}
if (!badImgs) ok(imgs + ' screenshots are PNGs over 5 KB');

// 4. Study 02 round 4 is the committed wireframe, unchanged
console.log('provenance');
const committed = git('show', '2c3e0d6:wireframe/index.html');
if (committed.status !== 0) fail('cannot read 2c3e0d6:wireframe/index.html from git');
else Buffer.compare(committed.stdout, fs.readFileSync(path.join(here, 'iterations/02/rev4.html'))) === 0
  ? ok('02/rev4.html is byte-identical to 2c3e0d6:wireframe/index.html')
  : fail('02/rev4.html differs from the commit it claims to be');

// 5. snapshot rule: studies older than the newest are unchanged since committed
console.log('snapshots');
for (const e of entries.slice(1)) {
  const dir = 'studies/' + path.dirname(e.file);
  // HEAD, not the index: a staged-but-uncommitted study is still free to change
  const tracked = git('ls-tree', '-r', '--name-only', 'HEAD', '--', dir).stdout.toString().trim();
  if (!tracked) { console.log('  skip ' + dir + ' not committed yet'); continue; }
  const diff = git('diff', '--name-only', 'HEAD', '--', dir).stdout.toString().trim();
  diff ? fail(dir + ' edited after commit (make a new study instead): ' + diff.split('\n').join(', ')) : ok(dir + ' unchanged since committed');
}

// 6. server, if up
http.get('http://127.0.0.1:8794/studies/', (res) => {
  res.statusCode === 200 ? ok('server answers on 8794') : fail('server status ' + res.statusCode);
  res.resume(); done();
}).on('error', () => { console.log('  skip server not running (node studies/server.cjs)'); done(); });

function done() {
  console.log(failures ? failures + ' failure(s)' : 'all checks passed');
  process.exitCode = failures ? 1 : 0;
}
