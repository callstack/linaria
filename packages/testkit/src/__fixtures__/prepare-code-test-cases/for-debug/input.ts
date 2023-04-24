// slugify
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
var _exportNames = {
  asyncResolveFallback: true,
  collectExportsAndImports: true,
  slugify: true,
};
Object.defineProperty(exports, 'asyncResolveFallback', {
  enumerable: true,
  get: function () {
    return _asyncResolveFallback.default;
  },
});
Object.defineProperty(exports, 'collectExportsAndImports', {
  enumerable: true,
  get: function () {
    return _collectExportsAndImports.default;
  },
});
Object.defineProperty(exports, 'slugify', {
  enumerable: true,
  get: function () {
    return _slugify.default;
  },
});
var _asyncResolveFallback = _interopRequireWildcard(
  require('./asyncResolveFallback')
);
var _collectExportsAndImports = _interopRequireWildcard(
  require('./collectExportsAndImports')
);
Object.keys(_collectExportsAndImports).forEach(function (key) {
  if (key === 'default' || key === '__esModule') return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _collectExportsAndImports[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _collectExportsAndImports[key];
    },
  });
});
var _slugify = _interopRequireDefault(require('./slugify'));
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
function _getRequireWildcardCache(nodeInterop) {
  if (typeof WeakMap !== 'function') return null;
  var cacheBabelInterop = new WeakMap();
  var cacheNodeInterop = new WeakMap();
  return (_getRequireWildcardCache = function (nodeInterop) {
    return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
  })(nodeInterop);
}
function _interopRequireWildcard(obj, nodeInterop) {
  if (!nodeInterop && obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return { default: obj };
  }
  var cache = _getRequireWildcardCache(nodeInterop);
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {};
  var hasPropertyDescriptor =
    Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (key !== 'default' && Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor
        ? Object.getOwnPropertyDescriptor(obj, key)
        : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}
