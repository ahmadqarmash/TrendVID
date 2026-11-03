/** Parse-check every JS file in the project with `node --check` (no execution). */
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['src', 'public', 'scripts', 'tests'];
const SKIP = new Set(['node_modules', '.wrangler', '.git']);

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (/\.(m?js)$/.test(name)) files.push(full);
  }
  return files;
}

const files = DIRS.flatMap((d) => walk(join(root, d)));
let failed = 0;
for (const file of files) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (error) {
    failed += 1;
    console.error(`✗ ${relative(root, file)}\n${error.stderr?.toString() || error.message}`);
  }
}
console.log(`${files.length - failed}/${files.length} files parse cleanly`);
process.exit(failed ? 1 : 0);
