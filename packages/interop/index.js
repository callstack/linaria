module.exports = function ({ types: t }, config = {}) {
  const library = config.library || 'styled-components';
  const isLibrary =
    library instanceof RegExp ? (s) => library.test(s) : (s) => s === library;
  const fixer = {
    'MemberExpression|Identifier': (path) => {
      if (!t.isTemplateLiteral(path.parent) || path.listKey !== 'expressions') {
        return;
      }

      const original = path.node;
      path.replaceWithSourceString(
        `(i => i && i.__linaria ? '.' + i.__linaria.className : i)('placeholder')`
      );
      path.get('arguments.0').replaceWith(original);
    },
  };

  return {
    visitor: {
      TaggedTemplateExpression(path) {
        const tag = path.get('tag');
        let identifier = null;
        if (t.isIdentifier(tag)) {
          identifier = tag;
        } else if (t.isMemberExpression(tag)) {
          identifier = tag.get('object');
        } else if (t.isCallExpression(tag)) {
          identifier = tag.get('callee');
        }

        if (t.isMemberExpression(identifier)) {
          // it's something like styled().attrs()
          if (t.isCallExpression(identifier.node.object)) {
            identifier = identifier.get('object.callee');
          } else if (t.isMemberExpression(identifier.node.object)) {
            identifier = identifier.get('object.object');
          }
        }

        const scope = identifier.scope;
        const binding = scope.getBinding(identifier.node.name);
        if (!t.isImportDeclaration(binding.path.parent)) {
          return;
        }

        const importSource = binding.path.parent.source.value;
        if (isLibrary(importSource)) {
          path.get('quasi').traverse(fixer);
        }
      },
    },
  };
};
