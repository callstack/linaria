"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = evaluate;

var _module = _interopRequireDefault(require("../module"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * This file is an entry point for module evaluation for getting lazy dependencies.
 */
function evaluate(code, filename, options) {
  const m = new _module.default(filename, options);
  m.dependencies = [];
  m.evaluate(code, ['__linariaPreval']);
  return {
    value: m.exports,
    dependencies: m.dependencies
  };
}
//# sourceMappingURL=index.js.map