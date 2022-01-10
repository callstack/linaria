"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = dynamic;

var _pluginSyntaxDynamicImport = _interopRequireDefault(require("@babel/plugin-syntax-dynamic-import"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function dynamic({
  types: t
}) {
  return {
    inherits: _pluginSyntaxDynamicImport.default,
    visitor: {
      Import(path) {
        const noop = t.arrowFunctionExpression([], t.identifier('undefined'));
        path.parentPath.replaceWith(t.objectExpression([t.objectProperty(t.identifier('then'), noop), t.objectProperty(t.identifier('catch'), noop)]));
      }

    }
  };
}
//# sourceMappingURL=dynamic-import-noop.js.map