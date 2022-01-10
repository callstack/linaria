"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = {
  processors: [require.resolve('./preprocessor')],
  syntax: 'scss',
  rules: {
    'property-no-vendor-prefix': true,
    'string-no-newline': true,
    'value-no-vendor-prefix': true,
    'no-empty-source': null,
    'no-extra-semicolons': null
  }
};
exports.default = _default;
//# sourceMappingURL=index.js.map