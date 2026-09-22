/**
 * Syntax-checks every hand-written JS file with `node --check`.
 * Works for ESM because package.json declares "type": "module".
 * Used by `npm run check` and by CI.
 */
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const TARGETS = ['site/assets/js', 'api/src', 'tests', 'scripts'];
const EXTENSIONS = ['.js', '.mjs'];

function walk(dir, out = []) {
  let entries = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (EXTENSIONS.some((ext) => entry.endsWith(ext))) out.push(full);
  }
  return out;
}

const files = TARGETS.flatMap((target) => walk(join(ROOT, target)));
let failures = 0;

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status === 0) {
    console.log(`ok    ${relative(ROOT, file)}`);
  } else {
    failures += 1;
    console.error(`FAIL  ${relative(ROOT, file)}\n${result.stderr.trim()}`);
  }
}

console.log(`\n${files.length - failures}/${files.length} files parsed cleanly.`);
process.exit(failures ? 1 : 0);
