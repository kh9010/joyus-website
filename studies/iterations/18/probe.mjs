// Runs bake/probe.html (where do the face creases come from?) and prints it.
//   node studies/iterations/18/probe.mjs [dome]
import { chrome } from './cdp.mjs';
const c = await chrome();
try {
  await c.visit('http://127.0.0.1:8794/studies/iterations/18/bake/probe.html?dome=' + (process.argv[2] ?? 40));
  await c.waitFor('!!window.PROBE', 240000);
  console.table(await c.evaluate('window.PROBE'));
  if (c.errors.length) console.log(c.errors);
} finally { c.close(); }
