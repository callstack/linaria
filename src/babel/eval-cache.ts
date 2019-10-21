import { createHash } from 'crypto';

import { debug } from './utils/logger';

const fileHashes = new Map<string, string>();
const evalCache = new Map<string, any>();

const hash = (text: string) =>
  createHash('sha1')
    .update(text)
    .digest('base64');

let lastText: string = '';
let lastHash: string = hash(lastText);

const memoizedHash: typeof hash = text => {
  if (lastText !== text) {
    lastHash = hash(text);
    lastText = text;
  }

  return lastHash;
};

export const clear = () => {
  fileHashes.clear();
  evalCache.clear();
};

export const has = (filename: string, text: string): boolean => {
  const textHash = memoizedHash(text);
  debug(`EVAL CACHE has ${filename} ${textHash}`);

  return fileHashes.get(filename) === textHash;
};

export const get = (filename: string, text: string): any => {
  const textHash = memoizedHash(text);
  debug(`EVAL CACHE get ${filename} ${textHash}`);

  if (fileHashes.get(filename) !== textHash) {
    return undefined;
  }

  return evalCache.get(filename);
};

export const set = (filename: string, text: string, value: any): void => {
  const textHash = memoizedHash(text);
  debug(`EVAL CACHE set ${filename} ${textHash}`);

  fileHashes.set(filename, textHash);
  evalCache.set(filename, value);
};
