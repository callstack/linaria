"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isSerializable;

var _isBoxedPrimitive = _interopRequireDefault(require("./isBoxedPrimitive"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isSerializable(o) {
  return Array.isArray(o) && o.every(isSerializable) || typeof o === 'object' && o !== null && (o.constructor.name === 'Object' || (0, _isBoxedPrimitive.default)(o));
}
//# sourceMappingURL=isSerializable.js.map