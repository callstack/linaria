"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = CollectDependencies;

var _logger = require("@linaria/logger");

var _generator = _interopRequireDefault(require("@babel/generator"));

var _throwIfInvalid = _interopRequireDefault(require("../utils/throwIfInvalid"));

var _types = require("../types");

var _getTemplateType = _interopRequireDefault(require("../utils/getTemplateType"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * This file is a visitor that checks TaggedTemplateExpressions and look for Linaria css or styled templates.
 * For each template it makes a list of dependencies, try to evaluate expressions, and if it is not possible, mark them as lazy dependencies.
 */

/**
 * Hoist the node and its dependencies to the highest scope possible
 */
function hoist(babel, ex) {
  const Identifier = idPath => {
    if (!idPath.isReferencedIdentifier()) {
      return;
    }

    const binding = idPath.scope.getBinding(idPath.node.name);
    if (!binding) return;
    const {
      scope,
      path: bindingPath,
      referencePaths
    } = binding; // parent here can be null or undefined in different versions of babel

    if (!scope.parent) {
      // It's a variable from global scope
      return;
    }

    if (bindingPath.isVariableDeclarator()) {
      const initPath = bindingPath.get('init');
      hoist(babel, initPath);
      initPath.hoist(scope);

      if (initPath.isIdentifier()) {
        referencePaths.forEach(referencePath => {
          referencePath.replaceWith(babel.types.identifier(initPath.node.name));
        });
      }
    }
  };

  if (ex.isIdentifier()) {
    return Identifier(ex);
  }

  ex.traverse({
    Identifier
  });
}

function CollectDependencies(babel, path, state, options) {
  const {
    libResolver
  } = options;
  const {
    types: t
  } = babel;
  const templateType = (0, _getTemplateType.default)(babel, path, state, libResolver);

  if (!templateType) {
    return;
  }

  const expressions = path.get('quasi').get('expressions');
  (0, _logger.debug)('template-parse:identify-expressions', expressions.length);
  const expressionValues = expressions.map(ex => {
    if (!ex.isExpression()) {
      throw ex.buildCodeFrameError(`The expression '${(0, _generator.default)(ex.node).code}' is not supported.`);
    }

    const result = ex.evaluate();

    if (result.confident) {
      (0, _throwIfInvalid.default)(result.value, ex);
      return {
        kind: _types.ValueType.VALUE,
        value: result.value
      };
    }

    if (options.evaluate && !(t.isFunctionExpression(ex) || t.isArrowFunctionExpression(ex))) {
      // save original expression that may be changed during hoisting
      const originalExNode = t.cloneNode(ex.node);
      hoist(babel, ex); // save hoisted expression to be used to evaluation

      const hoistedExNode = t.cloneNode(ex.node); // get back original expression to the tree

      ex.replaceWith(originalExNode);
      return {
        kind: _types.ValueType.LAZY,
        ex: hoistedExNode,
        originalEx: ex
      };
    }

    return {
      kind: _types.ValueType.FUNCTION,
      ex
    };
  });
  (0, _logger.debug)('template-parse:evaluate-expressions', expressionValues.map(expressionValue => expressionValue.kind === _types.ValueType.VALUE ? expressionValue.value : 'lazy'));

  if (templateType !== 'css' && templateType !== 'atomic-css' && 'name' in templateType.component.node) {
    // It's not a real dependency.
    // It can be simplified because we need just a className.
    expressionValues.push({
      // kind: ValueType.COMPONENT,
      kind: _types.ValueType.LAZY,
      ex: templateType.component.node.name,
      originalEx: templateType.component.node.name
    });
  }

  state.queue.push({
    styled: templateType !== 'css' && templateType !== 'atomic-css' ? templateType : undefined,
    path,
    expressionValues
  });
}
//# sourceMappingURL=CollectDependencies.js.map