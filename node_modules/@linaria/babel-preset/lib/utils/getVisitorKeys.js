"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getVisitorKeys;

var _core = require("@babel/core");

function getVisitorKeys(node) {
  return _core.types.VISITOR_KEYS[node.type];
}
//# sourceMappingURL=getVisitorKeys.js.map