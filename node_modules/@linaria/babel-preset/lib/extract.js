"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extract;

var _template = require("@babel/template");

var _generator = _interopRequireDefault(require("@babel/generator"));

var _logger = require("@linaria/logger");

var _evaluators = _interopRequireDefault(require("./evaluators"));

var _templateProcessor = _interopRequireDefault(require("./evaluators/templateProcessor"));

var _module = _interopRequireDefault(require("./module"));

var _types = require("./types");

var _CollectDependencies = _interopRequireDefault(require("./visitors/CollectDependencies"));

var _DetectStyledImportName = _interopRequireDefault(require("./visitors/DetectStyledImportName"));

var _GenerateClassNames = _interopRequireDefault(require("./visitors/GenerateClassNames"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-param-reassign */

/**
 * This is an entry point for styles extraction.
 * On enter, It:
 *  - traverse the code using visitors (TaggedTemplateExpression, ImportDeclaration)
 *  - schedule evaluation of lazy dependencies (those who are not simple expressions //TODO does they have it's name?)
 *  - let templateProcessor to save evaluated values in babel state as `replacements`.
 * On exit, It:
 *  - store result of extraction in babel's file metadata
 */
function isLazyValue(v) {
  return v.kind === _types.ValueType.LAZY;
}

function isNodePath(obj) {
  return 'node' in obj && (obj === null || obj === void 0 ? void 0 : obj.node) !== undefined;
}

function findFreeName(scope, name) {
  // By default `name` is used as a name of the function …
  let nextName = name;
  let idx = 0;

  while (scope.hasBinding(nextName, false)) {
    // … but if there is an already defined variable with this name …
    // … we are trying to use a name like wrap_N
    idx += 1;
    nextName = `wrap_${idx}`;
  }

  return nextName;
}

function unwrapNode(item) {
  if (typeof item === 'string') {
    return item;
  }

  return isNodePath(item) ? item.node : item;
} // All exported values will be wrapped with this function


const expressionWrapperTpl = (0, _template.statement)(`
  const %%wrapName%% = (fn) => {
    try {
      return fn();
    } catch (e) {
      return e;
    }
  };
`);
const expressionTpl = (0, _template.expression)(`%%wrapName%%(() => %%expression%%)`);
const exportsLinariaPrevalTpl = (0, _template.statement)(`exports.__linariaPreval = %%expressions%%`);

function addLinariaPreval({
  types: t
}, path, lazyDeps) {
  // Constant __linariaPreval with all dependencies
  const wrapName = findFreeName(path.scope, '_wrap');
  const statements = [expressionWrapperTpl({
    wrapName
  }), exportsLinariaPrevalTpl({
    expressions: t.arrayExpression(lazyDeps.map(expression => expressionTpl({
      expression,
      wrapName
    })))
  })];
  const programNode = path.node;
  return t.program([...programNode.body, ...statements], programNode.directives, programNode.sourceType, programNode.interpreter);
}

function extract(babel, options) {
  const process = (0, _templateProcessor.default)(babel, options);
  return {
    visitor: {
      Program: {
        enter(path, state) {
          // Collect all the style rules from the styles we encounter
          state.queue = [];
          state.rules = {};
          state.index = -1;
          state.dependencies = [];
          state.replacements = [];
          (0, _logger.debug)('extraction:start', state.file.opts.filename); // Invalidate cache for module evaluation to get fresh modules

          _module.default.invalidate(); // We need our transforms to run before anything else
          // So we traverse here instead of a in a visitor


          path.traverse({
            ImportDeclaration: p => (0, _DetectStyledImportName.default)(babel, p, state),
            TaggedTemplateExpression: p => {
              (0, _GenerateClassNames.default)(babel, p, state, options);
              (0, _CollectDependencies.default)(babel, p, state, options);
            }
          });
          const lazyDeps = state.queue.reduce((acc, {
            expressionValues: values
          }) => {
            acc.push(...values.filter(isLazyValue));
            return acc;
          }, []);
          const expressionsToEvaluate = lazyDeps.map(v => unwrapNode(v.ex));
          const originalLazyExpressions = lazyDeps.map(v => unwrapNode(v.originalEx));
          (0, _logger.debug)('lazy-deps:count', lazyDeps.length);
          let lazyValues = [];

          if (expressionsToEvaluate.length > 0) {
            (0, _logger.debug)('lazy-deps:original-expressions-list', originalLazyExpressions.map(node => typeof node !== 'string' ? (0, _generator.default)(node).code : node));
            (0, _logger.debug)('lazy-deps:expressions-to-eval-list', expressionsToEvaluate.map(node => typeof node !== 'string' ? (0, _generator.default)(node).code : node));
            const program = addLinariaPreval(babel, path, expressionsToEvaluate);
            const {
              code
            } = (0, _generator.default)(program);
            (0, _logger.debug)('lazy-deps:evaluate', '');

            try {
              const evaluation = (0, _evaluators.default)(code, state.file.opts.filename, options);
              (0, _logger.debug)('lazy-deps:sub-files', evaluation.dependencies);
              state.dependencies.push(...evaluation.dependencies);
              lazyValues = evaluation.value.__linariaPreval || [];
              (0, _logger.debug)('lazy-deps:values', evaluation.value.__linariaPreval);
            } catch (e) {
              (0, _logger.error)('lazy-deps:evaluate:error', code);

              if (e instanceof Error) {
                throw new Error('An unexpected runtime error occurred during dependencies evaluation: \n' + e.stack + '\n\nIt may happen when your code or third party module is invalid or uses identifiers not available in Node environment, eg. window. \n' + 'Note that line numbers in above stack trace will most likely not match, because Linaria needed to transform your code a bit.\n');
              } else {
                throw e;
              }
            }
          }

          const valueCache = new Map();
          originalLazyExpressions.forEach((key, idx) => valueCache.set(key, lazyValues[idx]));
          state.queue.forEach(item => process(item, state, valueCache));
        },

        exit(_, state) {
          if (Object.keys(state.rules).length) {
            // Store the result as the file metadata under linaria key
            state.file.metadata.linaria = {
              rules: state.rules,
              replacements: state.replacements,
              dependencies: state.dependencies
            };
          } // Invalidate cache for module evaluation when we're done


          _module.default.invalidate();

          (0, _logger.debug)('extraction:end', state.file.opts.filename);
        }

      }
    }
  };
}
//# sourceMappingURL=extract.js.map