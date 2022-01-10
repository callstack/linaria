"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _generator = _interopRequireDefault(require("@babel/generator"));

var _isSerializable = _interopRequireDefault(require("./isSerializable"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Throw if we can't handle the interpolated value
function throwIfInvalid(value, ex) {
  if (typeof value === 'function' || typeof value === 'string' || typeof value === 'number' && Number.isFinite(value) || (0, _isSerializable.default)(value)) {
    return;
  } // We can't use instanceof here so let's use duck typing


  if (value && typeof value !== 'number' && value.stack && value.message) {
    throw ex.buildCodeFrameError(`An error occurred when evaluating the expression: 

  > ${value.message}. 

  Make sure you are not using a browser or Node specific API and all the variables are available in static context.
  Linaria have to extract pieces of your code to resolve the interpolated values.
  Defining styled component or class will not work inside:
    - function,
    - class,
    - method,
    - loop,
  because it cannot be statically determined in which context you use them.
  That's why some variables may be not defined during evaluation.
      `);
  }

  const stringified = typeof value === 'object' ? JSON.stringify(value) : String(value);
  throw ex.buildCodeFrameError(`The expression evaluated to '${stringified}', which is probably a mistake. If you want it to be inserted into CSS, explicitly cast or transform the value to a string, e.g. - 'String(${(0, _generator.default)(ex.node).code})'.`);
}

var _default = throwIfInvalid;
exports.default = _default;
//# sourceMappingURL=throwIfInvalid.js.map