"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.globals = void 0;

var _core = require("@linaria/core");

var _react = _interopRequireDefault(require("react"));

var _reactDom = _interopRequireDefault(require("react-dom"));

var _App = _interopRequireDefault(require("./components/App"));

var _constants = _interopRequireDefault(require("./styles/constants"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* $FlowFixMe */
_reactDom.default.render( /*#__PURE__*/_react.default.createElement(_App.default, null), document.getElementById('root'));

const globals = "g1cus5as";
exports.globals = globals;