"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _helperPluginUtils = require("@babel/helper-plugin-utils");

var _pluginTransformFlowStripTypes = require("@babel/plugin-transform-flow-strip-types");

var _normalizeOptions = require("./normalize-options");

var _default = (0, _helperPluginUtils.declare)((api, opts) => {
  api.assertVersion(7);
  const {
    all,
    allowDeclareFields
  } = (0, _normalizeOptions.default)(opts);
  return {
    plugins: [[_pluginTransformFlowStripTypes.default, {
      all,
      allowDeclareFields
    }]]
  };
});

exports.default = _default;