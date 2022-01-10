"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  slugify: true,
  EvalCache: true,
  buildOptions: true,
  JSXElement: true,
  ProcessCSS: true,
  ProcessStyled: true,
  Module: true,
  transform: true,
  extractCssFromAst: true,
  shouldTransformCode: true,
  isNode: true,
  getVisitorKeys: true,
  peek: true,
  CollectDependencies: true,
  DetectStyledImportName: true,
  GenerateClassNames: true
};
exports.default = linaria;
Object.defineProperty(exports, "slugify", {
  enumerable: true,
  get: function () {
    return _utils.slugify;
  }
});
Object.defineProperty(exports, "buildOptions", {
  enumerable: true,
  get: function () {
    return _buildOptions.default;
  }
});
Object.defineProperty(exports, "JSXElement", {
  enumerable: true,
  get: function () {
    return _JSXElement.default;
  }
});
Object.defineProperty(exports, "ProcessCSS", {
  enumerable: true,
  get: function () {
    return _ProcessCSS.default;
  }
});
Object.defineProperty(exports, "ProcessStyled", {
  enumerable: true,
  get: function () {
    return _ProcessStyled.default;
  }
});
Object.defineProperty(exports, "Module", {
  enumerable: true,
  get: function () {
    return _module.default;
  }
});
Object.defineProperty(exports, "transform", {
  enumerable: true,
  get: function () {
    return _transform.default;
  }
});
Object.defineProperty(exports, "extractCssFromAst", {
  enumerable: true,
  get: function () {
    return _transform.extractCssFromAst;
  }
});
Object.defineProperty(exports, "shouldTransformCode", {
  enumerable: true,
  get: function () {
    return _transform.shouldTransformCode;
  }
});
Object.defineProperty(exports, "isNode", {
  enumerable: true,
  get: function () {
    return _isNode.default;
  }
});
Object.defineProperty(exports, "getVisitorKeys", {
  enumerable: true,
  get: function () {
    return _getVisitorKeys.default;
  }
});
Object.defineProperty(exports, "peek", {
  enumerable: true,
  get: function () {
    return _peek.default;
  }
});
Object.defineProperty(exports, "CollectDependencies", {
  enumerable: true,
  get: function () {
    return _CollectDependencies.default;
  }
});
Object.defineProperty(exports, "DetectStyledImportName", {
  enumerable: true,
  get: function () {
    return _DetectStyledImportName.default;
  }
});
Object.defineProperty(exports, "GenerateClassNames", {
  enumerable: true,
  get: function () {
    return _GenerateClassNames.default;
  }
});
exports.EvalCache = void 0;

var _logger = require("@linaria/logger");

var _loadOptions = _interopRequireDefault(require("./utils/loadOptions"));

var _utils = require("@linaria/utils");

var _EvalCache = _interopRequireWildcard(require("./eval-cache"));

exports.EvalCache = _EvalCache;

var _buildOptions = _interopRequireDefault(require("./evaluators/buildOptions"));

var _JSXElement = _interopRequireDefault(require("./evaluators/visitors/JSXElement"));

var _ProcessCSS = _interopRequireDefault(require("./evaluators/visitors/ProcessCSS"));

var _ProcessStyled = _interopRequireDefault(require("./evaluators/visitors/ProcessStyled"));

var _module = _interopRequireDefault(require("./module"));

var _transform = _interopRequireWildcard(require("./transform"));

var _types = require("./types");

Object.keys(_types).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _types[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _types[key];
    }
  });
});

var _isNode = _interopRequireDefault(require("./utils/isNode"));

var _getVisitorKeys = _interopRequireDefault(require("./utils/getVisitorKeys"));

var _peek = _interopRequireDefault(require("./utils/peek"));

var _CollectDependencies = _interopRequireDefault(require("./visitors/CollectDependencies"));

var _DetectStyledImportName = _interopRequireDefault(require("./visitors/DetectStyledImportName"));

var _GenerateClassNames = _interopRequireDefault(require("./visitors/GenerateClassNames"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * File defines babel prest for Linaria.
 * It uses ./extract function that is an entry point for styles extraction.
 * It also bypass babel options defined in Linaria config file with it's defaults (see ./utils/loadOptions).
 */
function isEnabled(caller) {
  return (caller === null || caller === void 0 ? void 0 : caller.name) !== 'linaria' || !caller.evaluate;
}

function linaria(babel, options) {
  if (!babel.caller(isEnabled)) {
    return {};
  }

  (0, _logger.debug)('options', JSON.stringify(options));
  return {
    plugins: [[require('./extract'), (0, _loadOptions.default)(options)]]
  };
}
//# sourceMappingURL=index.js.map