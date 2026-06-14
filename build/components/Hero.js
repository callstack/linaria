"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Hero;
var _react = require("@linaria/react");
var _react2 = _interopRequireDefault(require("react"));
var _Container = _interopRequireDefault(require("./Container"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const codeSample = "/dist/d0cd8b67723136cfcd108dc56a39cdb8.png";
function Hero() {
  return /*#__PURE__*/_react2.default.createElement(HeroContainer, null, /*#__PURE__*/_react2.default.createElement(_Container.default, null, /*#__PURE__*/_react2.default.createElement(Row, null, /*#__PURE__*/_react2.default.createElement(LeftColumn, null, /*#__PURE__*/_react2.default.createElement(Heading, null, "Zero-Runtime CSS in JS"), /*#__PURE__*/_react2.default.createElement(Description, null, "Write CSS in JS and get real CSS files during build. Use dynamic prop based styles with the React bindings and have them transpiled to CSS variables automatically. Great productivity with source maps and linting support."), /*#__PURE__*/_react2.default.createElement(Button, {
    as: "a",
    href: "https://github.com/callstack/linaria#installation"
  }, "Get Started")), /*#__PURE__*/_react2.default.createElement(RightColumn, null, /*#__PURE__*/_react2.default.createElement(CodeSample, {
    alt: "Linaria code sample",
    src: codeSample
  })))));
}
const HeroContainer = /*#__PURE__*/(0, _react.styled)('main')({
  name: "HeroContainer",
  class: "hxwxvp7",
  propsAsIs: false
});
const Row = /*#__PURE__*/(0, _react.styled)('div')({
  name: "Row",
  class: "rb67u9s",
  propsAsIs: false
});
const LeftColumn = /*#__PURE__*/(0, _react.styled)('div')({
  name: "LeftColumn",
  class: "l1qaax7y",
  propsAsIs: false
});
const RightColumn = /*#__PURE__*/(0, _react.styled)('div')({
  name: "RightColumn",
  class: "rg5wq9k",
  propsAsIs: false
});
const Heading = /*#__PURE__*/(0, _react.styled)('h1')({
  name: "Heading",
  class: "h1aabxkw",
  propsAsIs: false
});
const Description = /*#__PURE__*/(0, _react.styled)('p')({
  name: "Description",
  class: "d125axcd",
  propsAsIs: false
});
const Button = /*#__PURE__*/(0, _react.styled)('button')({
  name: "Button",
  class: "btjyyyo",
  propsAsIs: false
});
const CodeSample = /*#__PURE__*/(0, _react.styled)('img')({
  name: "CodeSample",
  class: "csfzl5o",
  propsAsIs: false
});