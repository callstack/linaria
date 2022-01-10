"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.set = exports.get = exports.has = exports.clearForFile = exports.clear = void 0;

var _crypto = require("crypto");

var _logger = require("@linaria/logger");

const fileHashes = new Map();
const evalCache = new Map();
const fileKeys = new Map();

const hash = text => (0, _crypto.createHash)('sha1').update(text).digest('base64');

let lastText = '';
let lastHash = hash(lastText);

const memoizedHash = text => {
  if (lastText !== text) {
    lastHash = hash(text);
    lastText = text;
  }

  return lastHash;
};

const toKey = (filename, exports) => exports.length > 0 ? `${filename}:${exports.join(',')}` : filename;

const clear = () => {
  fileHashes.clear();
  evalCache.clear();
  fileKeys.clear();
};

exports.clear = clear;

const clearForFile = filename => {
  var _fileKeys$get;

  const keys = (_fileKeys$get = fileKeys.get(filename)) !== null && _fileKeys$get !== void 0 ? _fileKeys$get : [];

  if (keys.length === 0) {
    return;
  }

  (0, _logger.debug)('eval-cache:clear-for-file', filename);

  for (const key of keys) {
    fileHashes.delete(key);
    evalCache.delete(key);
  }

  fileKeys.set(filename, []);
};

exports.clearForFile = clearForFile;

const has = ([filename, ...exports], text) => {
  const key = toKey(filename, exports);
  const textHash = memoizedHash(text);
  (0, _logger.debug)('eval-cache:has', `${key} ${textHash}`);
  return fileHashes.get(key) === textHash;
};

exports.has = has;

const get = ([filename, ...exports], text) => {
  const key = toKey(filename, exports);
  const textHash = memoizedHash(text);
  (0, _logger.debug)('eval-cache:get', `${key} ${textHash}`);

  if (fileHashes.get(key) !== textHash) {
    return undefined;
  }

  return evalCache.get(key);
};

exports.get = get;

const set = ([filename, ...exports], text, value) => {
  const key = toKey(filename, exports);
  const textHash = memoizedHash(text);
  (0, _logger.debug)('eval-cache:set', `${key} ${textHash}`);
  fileHashes.set(key, textHash);
  evalCache.set(key, value);

  if (!fileKeys.has(filename)) {
    fileKeys.set(filename, []);
  }

  fileKeys.get(filename).push(key);
};

exports.set = set;
//# sourceMappingURL=eval-cache.js.map