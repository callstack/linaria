// Fails while this example resolves a vite older than MIN_VITE in pnpm-lock.yaml.
// Run it from this directory: node check-vite-version.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIN_VITE = '8.3.5';
const IMPORTER = 'examples/vpssr-linaria-solid';

const lockfile = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../pnpm-lock.yaml'),
  'utf8'
).split('\n');

// The lines under the `  <key>:` line at `indent`, up to the next line that is
// indented as much or less.
const entry = (lines, key, indent) => {
  const start = lines.indexOf(`${' '.repeat(indent)}${key}:`);
  if (start === -1) return [];
  const end = lines.findIndex(
    (line, i) => i > start && line.trim() && line.search(/\S/) <= indent
  );
  return lines.slice(start + 1, end === -1 ? lines.length : end);
};

const vite = entry(entry(lockfile, IMPORTER, 2), 'vite', 6);
const resolved = vite
  .map((line) => line.match(/^ {8}version: (\d+\.\d+\.\d+)/)?.[1])
  .find(Boolean);

const key = (version) =>
  version.split('.').reduce((sum, part) => sum * 1000 + Number(part), 0);

if (!resolved || key(resolved) < key(MIN_VITE)) {
  console.error(
    `${IMPORTER} resolves vite ${resolved ?? '(none)'} in pnpm-lock.yaml, ` +
      `but vite ${MIN_VITE} or later is required`
  );
  process.exit(1);
}

console.log(`${IMPORTER} resolves vite ${resolved}`);
