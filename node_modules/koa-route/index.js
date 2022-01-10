
'use strict';

/**
 * Module dependencies.
 */

const pathToRegexp = require('path-to-regexp');
const debug = require('debug')('koa-route');
const methods = require('methods');

methods.forEach(function(method){
  module.exports[method] = create(method);
});

module.exports.del = module.exports.delete;
module.exports.all = create();

function create(method) {
  if (method) method = method.toUpperCase();

  return function(path, fn, opts){
    const re = pathToRegexp(path, opts);
    debug('%s %s -> %s', method || 'ALL', path, re);

    const createRoute = function(routeFunc){
      return function (ctx, next){
        // method
        if (!matches(ctx, method)) return next();

        // path
        const m = re.exec(ctx.path);
        if (m) {
          const args = m.slice(1).map(decode);
          ctx.routePath = path;
          debug('%s %s matches %s %j', ctx.method, path, ctx.path, args);
          args.unshift(ctx);
          args.push(next);
          return Promise.resolve(routeFunc.apply(ctx, args));
        }

        // miss
        return next();
      }
    };

    if (fn) {
      return createRoute(fn);
    } else {
      return createRoute;
    }
  }
}

/**
 * Decode value.
 */

function decode(val) {
  if (val) return decodeURIComponent(val);
}

/**
 * Check request method.
 */

function matches(ctx, method) {
  if (!method) return true;
  if (ctx.method === method) return true;
  if (method === 'GET' && ctx.method === 'HEAD') return true;
  return false;
}
