// Tiny assertion harness — no dependencies, so `node test/run-all.mjs` works
// on a clean checkout with nothing installed.

let passed = 0;
let failed = 0;
const failures = [];
let suite = '';

export function describe(name) {
  suite = name;
  console.log(`\n── ${name} ${'─'.repeat(Math.max(0, 60 - name.length))}`);
}

export function ok(condition, label, detail) {
  if (condition) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    failures.push(`${suite} :: ${label}${detail ? ` — ${detail}` : ''}`);
    console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ''}`);
  }
}

export function eq(actual, expected, label) {
  ok(
    JSON.stringify(actual) === JSON.stringify(expected),
    label,
    `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
  );
}

export function report() {
  console.log(`\n${'='.repeat(64)}`);
  console.log(`${passed} passed, ${failed} failed`);
  if (failures.length) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  - ${f}`);
  }
  console.log('='.repeat(64));
  return failed;
}

export function counts() {
  return { passed, failed };
}
