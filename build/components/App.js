"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Index;
var _react = _interopRequireDefault(require("react"));
var _atomic = require("@linaria/atomic");
var _Header = _interopRequireDefault(require("./Header"));
var _Hero = _interopRequireDefault(require("./Hero"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const Page = "atm_26_1u0dmv0 atm_7l_u67f1s atm_j6_1kxcs5u atm_sy_12yic89";
function Index() {
  return /*#__PURE__*/_react.default.createElement("div", {
    className: (0, _atomic.cx)(Page)
  }, /*#__PURE__*/_react.default.createElement(_Header.default, null), /*#__PURE__*/_react.default.createElement(_Hero.default, null));
}