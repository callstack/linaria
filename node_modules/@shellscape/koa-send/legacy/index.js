function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

/**
 * Module dependencies.
 */
const debug = require('debug')('koa-send');

const resolvePath = require('resolve-path');

const createError = require('http-errors');

const assert = require('assert');

const fs = require('mz/fs');

const {
  normalize,
  basename,
  extname,
  resolve,
  parse,
  sep
} = require('path');
/**
 * Expose `send()`.
 */


module.exports = send;
/**
 * Send file at `path` with the
 * given `options` to the koa `ctx`.
 *
 * @param {Context} ctx
 * @param {String} path
 * @param {Object} [opts]
 * @return {Function}
 * @api public
 */

function send(_x, _x2) {
  return _send.apply(this, arguments);
}
/**
 * Check if it's hidden.
 */


function _send() {
  _send = _asyncToGenerator(function* (ctx, path, opts = {}) {
    assert(ctx, 'koa context required');
    assert(path, 'pathname required'); // options

    debug('send "%s" %j', path, opts);
    const root = opts.root ? normalize(resolve(opts.root)) : '';
    const trailingSlash = path[path.length - 1] === '/';
    path = path.substr(parse(path).root.length);
    const index = opts.index;
    const maxage = opts.maxage || opts.maxAge || 0;
    const immutable = opts.immutable || false;
    const hidden = opts.hidden || false;
    const format = opts.format !== false;
    const extensions = Array.isArray(opts.extensions) ? opts.extensions : false;
    const brotli = opts.brotli !== false;
    const gzip = opts.gzip !== false;
    const setHeaders = opts.setHeaders;

    if (setHeaders && typeof setHeaders !== 'function') {
      throw new TypeError('option setHeaders must be function');
    } // normalize path


    path = decode(path);
    if (path === -1) return ctx.throw(400, 'failed to decode'); // index file support

    if (index && trailingSlash) path += index;
    path = resolvePath(root, path); // hidden file support, ignore

    if (!hidden && isHidden(root, path)) return;
    let encodingExt = ''; // serve brotli file when possible otherwise gzipped file when possible

    if (ctx.acceptsEncodings('br', 'identity') === 'br' && brotli && (yield fs.exists(path + '.br'))) {
      path = path + '.br';
      ctx.set('Content-Encoding', 'br');
      ctx.res.removeHeader('Content-Length');
      encodingExt = '.br';
    } else if (ctx.acceptsEncodings('gzip', 'identity') === 'gzip' && gzip && (yield fs.exists(path + '.gz'))) {
      path = path + '.gz';
      ctx.set('Content-Encoding', 'gzip');
      ctx.res.removeHeader('Content-Length');
      encodingExt = '.gz';
    }

    if (extensions && !/\.[^/]*$/.exec(path)) {
      const list = [].concat(extensions);

      for (let i = 0; i < list.length; i++) {
        let ext = list[i];

        if (typeof ext !== 'string') {
          throw new TypeError('option extensions must be array of strings or false');
        }

        if (!/^\./.exec(ext)) ext = '.' + ext;

        if (yield fs.exists(path + ext)) {
          path = path + ext;
          break;
        }
      }
    } // stat


    let stats;

    try {
      stats = yield fs.stat(path); // Format the path to serve static file servers
      // and not require a trailing slash for directories,
      // so that you can do both `/directory` and `/directory/`

      if (stats.isDirectory()) {
        if (format && index) {
          path += '/' + index;
          stats = yield fs.stat(path);
        } else {
          return;
        }
      }
    } catch (err) {
      const notfound = ['ENOENT', 'ENAMETOOLONG', 'ENOTDIR'];

      if (notfound.includes(err.code)) {
        throw createError(404, err);
      }

      err.status = 500;
      throw err;
    }

    if (setHeaders) setHeaders(ctx.res, path, stats); // stream

    ctx.set('Content-Length', stats.size);
    if (!ctx.response.get('Last-Modified')) ctx.set('Last-Modified', stats.mtime.toUTCString());

    if (!ctx.response.get('Cache-Control')) {
      const directives = ['max-age=' + (maxage / 1000 | 0)];

      if (immutable) {
        directives.push('immutable');
      }

      ctx.set('Cache-Control', directives.join(','));
    }

    ctx.type = type(path, encodingExt);
    ctx.body = fs.createReadStream(path);
    return path;
  });
  return _send.apply(this, arguments);
}

function isHidden(root, path) {
  path = path.substr(root.length).split(sep);

  for (let i = 0; i < path.length; i++) {
    if (path[i][0] === '.') return true;
  }

  return false;
}
/**
 * File type.
 */


function type(file, ext) {
  return ext !== '' ? extname(basename(file, ext)) : extname(file);
}
/**
 * Decode `path`.
 */


function decode(path) {
  try {
    return decodeURIComponent(path);
  } catch (err) {
    return -1;
  }
}
