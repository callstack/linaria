"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = loadOptions;

var _cosmiconfig = _interopRequireDefault(require("cosmiconfig"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const explorer = (0, _cosmiconfig.default)('linaria');

function loadOptions(overrides = {}) {
  const {
    configFile,
    ignore,
    rules,
    ...rest
  } = overrides;
  const result = configFile !== undefined ? explorer.loadSync(configFile) : explorer.searchSync();
  return {
    displayName: false,
    evaluate: true,
    rules: rules !== null && rules !== void 0 ? rules : [{
      // FIXME: if `rule` is not specified in a config, `@linaria/shaker` should be added as a dependency
      // eslint-disable-next-line import/no-extraneous-dependencies
      action: require('@linaria/shaker').default
    }, {
      // The old `ignore` option is used as a default value for `ignore` rule.
      test: ignore !== null && ignore !== void 0 ? ignore : /[\\/]node_modules[\\/]/,
      action: 'ignore'
    }],
    ...(result ? result.config : null),
    ...rest
  };
}
//# sourceMappingURL=loadOptions.js.map