"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ProcessCSS;

var _core = require("@babel/core");

var _getLinariaComment = _interopRequireDefault(require("../../utils/getLinariaComment"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * This visitor replaces css tag with the generated className
 *
 */
function ProcessCSS(path) {
  if (_core.types.isIdentifier(path.node.tag) && path.node.tag.name === 'css') {
    const [,,, className] = (0, _getLinariaComment.default)(path);

    if (!className) {
      return;
    }

    path.replaceWith(_core.types.stringLiteral(className));
  }
}
//# sourceMappingURL=ProcessCSS.js.map