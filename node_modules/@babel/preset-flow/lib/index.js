"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _helperPluginUtils = require("@babel/helper-plugin-utils");

var _pluginTransformFlowStripTypes = _interopRequireDefault(require("@babel/plugin-transform-flow-strip-types"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = (0, _helperPluginUtils.declare)((api, {
  all,
  allowDeclareFields
}) => {
  api.assertVersion(7);
  return {
    plugins: [[_pluginTransformFlowStripTypes.default, {
      all,
      allowDeclareFields
    }]]
  };
});

exports.default = _default;