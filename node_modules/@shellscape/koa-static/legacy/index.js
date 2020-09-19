'use strict';
/**
 * Module dependencies.
 */

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } } function _next(value) { step("next", value); } function _throw(err) { step("throw", err); } _next(); }); }; }

const debug = require('debug')('koa-static');

const {
  resolve
} = require('path');

const assert = require('assert');

const send = require("@shellscape/koa-send/legacy");
/**
 * Expose `serve()`.
 */


module.exports = serve;
/**
 * Serve static files from `root`.
 *
 * @param {String} root
 * @param {Object} [opts]
 * @return {Function}
 * @api public
 */

function serve(root, opts) {
  opts = Object.assign({}, opts);
  assert(root, 'root directory is required to serve files'); // options

  debug('static "%s" %j', root, opts);
  opts.root = resolve(root);
  if (opts.index !== false) opts.index = opts.index || 'index.html';

  if (!opts.defer) {
    return (
      /*#__PURE__*/
      function () {
        var _serve = _asyncToGenerator(function* (ctx, next) {
          let done = false;

          if (ctx.method === 'HEAD' || ctx.method === 'GET') {
            try {
              done = yield send(ctx, ctx.path, opts);
            } catch (err) {
              if (err.status !== 404) {
                throw err;
              }
            }
          }

          if (!done) {
            yield next();
          }
        });

        return function serve(_x, _x2) {
          return _serve.apply(this, arguments);
        };
      }()
    );
  }

  return (
    /*#__PURE__*/
    function () {
      var _serve2 = _asyncToGenerator(function* (ctx, next) {
        yield next();
        if (ctx.method !== 'HEAD' && ctx.method !== 'GET') return; // response is already handled

        if (ctx.body != null || ctx.status !== 404) return; // eslint-disable-line

        try {
          yield send(ctx, ctx.path, opts);
        } catch (err) {
          if (err.status !== 404) {
            throw err;
          }
        }
      });

      return function serve(_x3, _x4) {
        return _serve2.apply(this, arguments);
      };
    }()
  );
}
