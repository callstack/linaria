"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ProcessStyled;

var _core = require("@babel/core");

var _template = require("@babel/template");

var _getLinariaComment = _interopRequireDefault(require("../../utils/getLinariaComment"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * This visitor replaces styled components with metadata about them.
 * CallExpression should be used to match styled components.
 * Works out of the box for styled that wraps other component,
 * styled.tagName are transformed to call expressions using @babel/plugin-transform-template-literals
 * @babel/plugin-transform-template-literals is loaded as a prest, to force proper ordering. It has to run just after linaria.
 * It is used explicitly in extractor, and loaded as a part of `prest-env` in shaker
 */
const linariaComponentTpl = (0, _template.expression)(`{
    displayName: %%displayName%%,
    __linaria: {
      className: %%className%%,
      extends: %%extends%%
    }
  }`);

function ProcessStyled(path) {
  const [type,, displayName, className] = (0, _getLinariaComment.default)(path);

  if (!className) {
    return;
  }

  if (type === 'css') {
    path.replaceWith(_core.types.stringLiteral(className));
    return;
  }

  path.replaceWith(linariaComponentTpl({
    className: _core.types.stringLiteral(className),
    displayName: displayName ? _core.types.stringLiteral(displayName) : null,
    extends: _core.types.isCallExpression(path.node.callee) ? path.node.callee.arguments[0] : _core.types.nullLiteral()
  }));
}
//# sourceMappingURL=ProcessStyled.js.map