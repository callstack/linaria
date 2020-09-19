"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

// eslint-disable-next-line import/no-extraneous-dependencies
var loglevel = require('loglevelnext/dist/loglevelnext');

var MethodFactory = loglevel.factories.MethodFactory;
var css = {
  prefix: 'color: #999; padding: 0 0 0 20px; line-height: 16px; background: url(https://webpack.js.org/6bc5d8cf78d442a984e70195db059b69.svg) no-repeat; background-size: 16px 16px; background-position: 0 -2px;',
  reset: 'color: #444'
};
var log = loglevel.getLogger({
  name: 'hot',
  id: 'hot-middleware/client'
});

function IconFactory(logger) {
  MethodFactory.call(this, logger);
}

IconFactory.prototype = Object.create(MethodFactory.prototype);
IconFactory.prototype.constructor = IconFactory;

IconFactory.prototype.make = function make(methodName) {
  var og = MethodFactory.prototype.make.call(this, methodName);
  return function _() {
    for (var _len = arguments.length, params = new Array(_len), _key = 0; _key < _len; _key++) {
      params[_key] = arguments[_key];
    }

    var args = [].concat(params);
    var prefix = '%c｢hot｣ %c';

    var _args = _slicedToArray(args, 1),
        first = _args[0];

    if (typeof first === 'string') {
      args[0] = prefix + first;
    } else {
      args.unshift(prefix);
    }

    args.splice(1, 0, css.prefix, css.reset);
    og.apply(void 0, _toConsumableArray(args));
  };
};

log.factory = new IconFactory(log, {});
log.group = console.group; // eslint-disable-line no-console

log.groupCollapsed = console.groupCollapsed; // eslint-disable-line no-console

log.groupEnd = console.groupEnd; // eslint-disable-line no-console

module.exports = log;