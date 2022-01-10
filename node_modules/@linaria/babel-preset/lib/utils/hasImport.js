"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = hasImport;

var _path = require("path");

var _module = _interopRequireDefault(require("../module"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const linariaLibs = new Set(['@linaria/core', '@linaria/react', '@linaria/atomic', 'linaria', 'linaria/react']);

const safeResolve = name => {
  try {
    return require.resolve(name);
  } catch (err) {
    return null;
  }
}; // Verify if the binding is imported from the specified source


function hasImport(t, scope, filename, identifier, sources, libResolver = safeResolve) {
  const binding = scope.getAllBindings()[identifier];

  if (!binding) {
    return false;
  }

  const p = binding.path;

  const resolveFromFile = id => {
    try {
      return _module.default._resolveFilename(id, {
        id: filename,
        filename,
        paths: _module.default._nodeModulePaths((0, _path.dirname)(filename))
      });
    } catch (e) {
      return null;
    }
  };

  const isImportingModule = value => sources.some(source => // If the value is an exact match, assume it imports the module
  value === source || // Otherwise try to resolve both and check if they are the same file
  resolveFromFile(value) === (linariaLibs.has(source) ? libResolver(source) : resolveFromFile(source)));

  if (t.isImportSpecifier(p) && t.isImportDeclaration(p.parentPath)) {
    return isImportingModule(p.parentPath.node.source.value);
  }

  if (t.isVariableDeclarator(p)) {
    if (t.isCallExpression(p.node.init) && t.isIdentifier(p.node.init.callee) && p.node.init.callee.name === 'require' && p.node.init.arguments.length === 1) {
      const node = p.node.init.arguments[0];

      if (t.isStringLiteral(node)) {
        return isImportingModule(node.value);
      }

      if (t.isTemplateLiteral(node) && node.quasis.length === 1) {
        return isImportingModule(node.quasis[0].value.cooked);
      }
    }
  }

  return false;
}
//# sourceMappingURL=hasImport.js.map