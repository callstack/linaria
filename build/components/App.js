"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Index;

var _react = require("../../../lib/react");

var _react2 = _interopRequireDefault(require("react"));

var _Header = _interopRequireDefault(require("./Header"));

var _Hero = _interopRequireDefault(require("./Hero"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Index() {
  return /*#__PURE__*/_react2.default.createElement(Page, null, /*#__PURE__*/_react2.default.createElement(_Header.default, null), /*#__PURE__*/_react2.default.createElement(_Hero.default, null));
}

const Page = /*#__PURE__*/(0, _react.styled)("div")({
  name: "Page",
  class: "p3kj8h0"
});