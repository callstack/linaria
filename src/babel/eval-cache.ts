import { createHash } from 'crypto';

import { debug } from './utils/logger';

const fileHashes = new Map<string, string>();
const evalCache = new Map<string, any>();
const fileKeys = new Map<string, string[]>();

const hash = (text: string) => createHash('sha1').update(text).digest('base64');

let lastText: string = '';
let lastHash: string = hash(lastText);

const memoizedHash: typeof hash = (text) => {
  if (lastText !== text) {
    lastHash = hash(text);
    lastText = text;
  }

  return lastHash;
};

const toKey = (filename: string, exports: string[]) =>
  exports.length > 0 ? `${filename}:${exports.join(',')}` : filename;

export const clear = () => {
  fileHashes.clear();
  evalCache.clear();
  fileKeys.clear();
};

export const clearForFile = (filename: string) => {
  const keys = fileKeys.get(filename) ?? [];
  if (keys.length === 0) {
    return;
  }

  debug('eval-cache:clear-for-file', filename);

  for (const key of keys) {
    fileHashes.delete(key);
    evalCache.delete(key);
  }

  fileKeys.set(filename, []);
};

export const has = (
  [filename, ...exports]: string[],
  text: string
): boolean => {
  const key = toKey(filename, exports);
  const textHash = memoizedHash(text);
  debug('eval-cache:has', `${key} ${textHash}`);

  return fileHashes.get(key) === textHash;
};

export const get = ([filename, ...exports]: string[], text: string): any => {
  const key = toKey(filename, exports);
  const textHash = memoizedHash(text);
  debug('eval-cache:get', `${key} ${textHash}`);

  if (fileHashes.get(key) !== textHash) {
    return undefined;
  }

  return evalCache.get(key);
};

export const set = (
  [filename, ...exports]: string[],
  text: string,
  value: any
): void => {
  const key = toKey(filename, exports);
  const textHash = memoizedHash(text);
  debug('eval-cache:set', `${key} ${textHash}`);

  fileHashes.set(key, textHash);
  evalCache.set(key, value);

  if (!fileKeys.has(filename)) {
    fileKeys.set(filename, []);
  }

  fileKeys.get(filename)!.push(key);
};
