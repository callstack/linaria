"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = toValidCSSIdentifier;

function toValidCSSIdentifier(s) {
  return s.replace(/[^-_a-z0-9\u00A0-\uFFFF]/gi, '_').replace(/^\d/, '_');
}
//# sourceMappingURL=toValidCSSIdentifier.js.map