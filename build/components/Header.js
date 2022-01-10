"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Header;

var _react = require("@linaria/react");

var _react2 = _interopRequireDefault(require("react"));

var _constants = _interopRequireDefault(require("../styles/constants"));

var _utils = require("../styles/utils");

var _Container = _interopRequireDefault(require("./Container"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Header() {
  return /*#__PURE__*/_react2.default.createElement(NavBar, null, /*#__PURE__*/_react2.default.createElement(LogoImage, {
    src: "/dist/1cc849b6b5e35d5ae2a527b0c2926958.svg",
    alt: "Linaria Logo"
  }), /*#__PURE__*/_react2.default.createElement(Links, null, /*#__PURE__*/_react2.default.createElement("li", null, /*#__PURE__*/_react2.default.createElement(LinkItem, {
    href: "https://github.com/callstack/linaria#features"
  }, "Features")), /*#__PURE__*/_react2.default.createElement("li", null, /*#__PURE__*/_react2.default.createElement(LinkItem, {
    target: "_blank",
    rel: "noopener noreferrer",
    href: "https://github.com/callstack/linaria/tree/master/docs"
  }, "Docs")), /*#__PURE__*/_react2.default.createElement("li", null, /*#__PURE__*/_react2.default.createElement(LinkItem, {
    target: "_blank",
    rel: "noopener noreferrer",
    href: "https://github.com/callstack/linaria",
    title: "GitHub"
  }, "GitHub"))));
}

const NavBar = /*#__PURE__*/(0, _react.styled)(_Container.default)({
  name: "NavBar",
  class: "n2pbki2"
});
const LogoImage = /*#__PURE__*/(0, _react.styled)("img")({
  name: "LogoImage",
  class: "lqydogw"
});
const Links = /*#__PURE__*/(0, _react.styled)("ul")({
  name: "Links",
  class: "l1xo6fno"
});
const LinkItem = /*#__PURE__*/(0, _react.styled)("a")({
  name: "LinkItem",
  class: "l1yoku03"
});