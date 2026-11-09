// Study 92: POST /api/study-92/pick, mounted by one line in studies/server.cjs. Body {row, pick}: row is a
// lines.json id; pick is {from, i} naming one of that row's options (from must match option i), {edit: "..."}
// (own words, at most 2000 characters), or null (back to option 1, which is 91 a). Anything else is a 400, a
// non-POST a 405, a cross-site Origin a 403. picks.json is written atomically (a temp file, then a rename).
// PICKS=<path> points the writes at another file (check.cjs uses a throwaway, never the real picks).
const fs = require('node:fs');
const path = require('node:path');
const LINES = path.join(__dirname, 'lines.json');
const picksFile = () => process.env.PICKS || path.join(__dirname, 'picks.json');

function valid(lines, row, pick) {
  const line = lines.find((l) => l.id === row);
  if (typeof row !== 'string' || !line) return false;
  if (pick === null) return true;
  if (!pick || typeof pick !== 'object' || Array.isArray(pick)) return false;
  const keys = Object.keys(pick).sort().join(',');
  if (keys === 'edit') return typeof pick.edit === 'string' && pick.edit.length <= 2000;
  if (keys === 'from,i') return Number.isInteger(pick.i) && pick.i >= 0 && pick.i < line.options.length && line.options[pick.i].from === pick.from;
  return false;
}

module.exports = function pick(req, res) {
  if (req.method !== 'POST') { res.writeHead(405, { Allow: 'POST' }).end(); return; }
  const origin = req.headers.origin;
  if (origin && origin !== 'http://' + req.headers.host) { res.writeHead(403).end(); return; }
  let body = '';
  req.on('data', (d) => { body += d; if (body.length > 8192) { res.writeHead(413).end(); req.destroy(); } });
  req.on('end', () => {
    if (res.headersSent) return;
    let msg;
    try { msg = JSON.parse(body); } catch { res.writeHead(400).end(); return; }
    let lines;
    try { lines = JSON.parse(fs.readFileSync(LINES, 'utf8')); } catch { res.writeHead(500).end(); return; }
    if (!msg || typeof msg !== 'object' || Object.keys(msg).sort().join(',') !== 'pick,row' || !valid(lines, msg.row, msg.pick)) { res.writeHead(400).end(); return; }
    const file = picksFile();
    let picks = {};
    try { picks = JSON.parse(fs.readFileSync(file, 'utf8')) || {}; } catch {}
    if (msg.pick === null) delete picks[msg.row]; else picks[msg.row] = msg.pick;
    const ordered = Object.fromEntries(lines.map((l) => l.id).filter((id) => id in picks).map((id) => [id, picks[id]]));
    const tmp = file + '.' + process.pid + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(ordered, null, 1) + '\n');
    fs.renameSync(tmp, file);
    res.writeHead(204).end();
  });
};
module.exports.valid = valid;
