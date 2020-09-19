'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mime = require('mime');

var _mime2 = _interopRequireDefault(_mime);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var baseEncodeTables = {
  26: 'abcdefghijklmnopqrstuvwxyz',
  32: '123456789abcdefghjkmnpqrstuvwxyz', // no 0lio
  36: '0123456789abcdefghijklmnopqrstuvwxyz',
  49: 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ', // no lIO
  52: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  58: '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ', // no 0lIO
  62: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  64: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_'
};

function encodeBufferToBase(buffer, base) {
  var encodeTable = baseEncodeTables[base];
  if (!encodeTable) throw new Error('Unknown encoding base' + base);

  var readLength = buffer.length;

  var Big = require('big.js');
  Big.RM = Big.DP = 0;
  var b = new Big(0);
  for (var i = readLength - 1; i >= 0; i--) {
    b = b.times(256).plus(buffer[i]);
  }

  var output = '';
  while (b.gt(0)) {
    output = encodeTable[b.mod(base)] + output;
    b = b.div(base);
  }

  Big.DP = 20;
  Big.RM = 1;

  return output;
}

function hash(contents, hashName, digestType, maxLength) {
  hashName = hashName || 'md5';
  maxLength = maxLength || 128;

  var hasher = _crypto2.default.createHash(hashName).update(contents);

  if (digestType === 'base26' || digestType === 'base32' || digestType === 'base36' || digestType === 'base49' || digestType === 'base52' || digestType === 'base58' || digestType === 'base62' || digestType === 'base64') {
    return encodeBufferToBase(hasher.digest(), digestType.substr(4)).substr(0, maxLength);
  } else {
    return hasher.digest(digestType || 'hex').substr(0, maxLength);
  }
}

exports.default = function (rootPath, filePath, opts) {
  var url = opts.name;
  var ext = 'bin';
  var basename = 'file';
  var directory = '';
  var outputPath = opts.outputPath;
  var publicPath = opts.publicPath.replace(/\/$/, '');
  var context = opts.context[0] == '/' ? opts.context.substr(1) : opts.context;
  var limit = opts.limit;
  var contextPath = _path2.default.resolve(rootPath, context);

  if (!_fsExtra2.default.existsSync(filePath)) {
    throw new Error('File does not exist');
  }

  var parsed = _path2.default.parse(filePath);

  if (parsed.ext) {
    ext = parsed.ext.substr(1);
  }

  var basePath = void 0;

  if (parsed.dir) {
    basename = parsed.name;
    basePath = parsed.dir + _path2.default.sep;
  }

  directory = _path2.default.relative(contextPath, basePath + '_').replace(/\\/g, '/').replace(/\.\.(\/)?/g, '_$1');
  directory = directory.substr(0, directory.length - 1);

  url = url.replace(/\[ext\]/gi, function () {
    return ext;
  }).replace(/\[name\]/gi, function () {
    return basename;
  }).replace(/\[path\]/gi, function () {
    return directory;
  });

  var contents = _fsExtra2.default.readFileSync(filePath);
  if (contents.length < limit) {
    var src = Buffer.from(contents);
    var mimetype = _mime2.default.getType(filePath) || '';
    return 'data:' + mimetype + ';base64,' + src.toString('base64');
  }

  url = url.replace(/\[(?:([^:]+):)?hash(?::([a-z]+\d*))?(?::(\d+))?\]/gi, function (_, hashType, digestType, maxLength) {
    return hash(contents, hashType, digestType, parseInt(maxLength, 10));
  });

  if (outputPath !== null) {
    _fsExtra2.default.copySync(filePath, _path2.default.join(rootPath, outputPath, url.split('?')[0]));
  }

  return publicPath + '/' + url;
};