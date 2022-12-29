import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

import asyncResolve, { syncResolve } from './asyncResolveFallback';

const encoding = 'utf8';
export const syncAcquire = (
  what: string,
  importer: string,
  stack: string[]
) => {
  const id = syncResolve(what, importer, stack);
  const code = readFileSync(id, encoding);
  return { id, code };
};

export const asyncAcquire = async (
  what: string,
  importer: string,
  stack: string[]
) => {
  const id = await asyncResolve(what, importer, stack);
  const code = await readFile(id, encoding);
  return { id, code };
};

export default asyncAcquire;
