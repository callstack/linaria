"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isBoxedPrimitive;
// There is a problem with using boxed numbers and strings in TS,
// so we cannot just use `instanceof` here
const constructors = ['Number', 'String'];

function isBoxedPrimitive(o) {
  return constructors.includes(o.constructor.name) && typeof (o === null || o === void 0 ? void 0 : o.valueOf()) !== 'object';
}
//# sourceMappingURL=isBoxedPrimitive.js.map