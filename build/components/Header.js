"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Header;
var _react = require("@linaria/react");
var _react2 = _interopRequireDefault(require("react"));
var _Container = _interopRequireDefault(require("./Container"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const logo = "/dist/1cc849b6b5e35d5ae2a527b0c2926958.svg";
function Header() {
  return /*#__PURE__*/_react2.default.createElement(NavBar, null, /*#__PURE__*/_react2.default.createElement(LogoImage, {
    src: logo,
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
const _exp = /*#__PURE__*/() => _Container.default;
const NavBar = /*#__PURE__*/(0, _react.styled)(_exp())({
  name: "NavBar",
  class: "n11jhqd8",
  propsAsIs: true
});
const LogoImage = /*#__PURE__*/(0, _react.styled)('img')({
  name: "LogoImage",
  class: "l2h01z2",
  propsAsIs: false
});
const Links = /*#__PURE__*/(0, _react.styled)('ul')({
  name: "Links",
  class: "lkd2pf6",
  propsAsIs: false
});
const LinkItem = /*#__PURE__*/(0, _react.styled)('a')({
  name: "LinkItem",
  class: "l6fgol",
  propsAsIs: false
});