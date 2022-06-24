import type { NodePath } from '@babel/traverse';
import type { Program } from '@babel/types';

import findIdentifiers from './findIdentifiers';
import { reference, referenceAll } from './scopeHelpers';

function findParentForDelete(path: NodePath): NodePath {
  const parent = path.parentPath;

  if (!parent) return path;

  if (parent.isVariableDeclaration() && parent.node.declarations.length === 1) {
    return findParentForDelete(parent);
  }

  if (parent.isImportDeclaration() && parent.node.specifiers.length === 1) {
    return findParentForDelete(parent);
  }

  if (parent?.isBlockStatement() && parent.node.body.length === 1) {
    return findParentForDelete(parent);
  }

  return path;
}

// @babel/preset-typescript transpiles enums, but doesn't reference used identifiers.
function referenceEnums(program: NodePath<Program>) {
  /*
   * We are looking for transpiled enums.
   *   (function (Colors) {
   *     Colors["BLUE"] = "#27509A";
   *   })(Colors || (Colors = {}));
   */
  program.traverse({
    ExpressionStatement(expressionStatement) {
      const expression = expressionStatement.get('expression');
      if (!expression.isCallExpression()) return;

      const callee = expression.get('callee');
      const args = expression.get('arguments');
      if (!callee.isFunctionExpression() || args.length !== 1) return;
      const [arg] = args;
      if (arg.isLogicalExpression({ operator: '||' })) {
        referenceAll(arg);
      }
    },
  });
}

// babel-plugin-istanbul doesn't reference its function calls
function referenceIstanbulUsages(program: NodePath<Program>) {
  /*
   * Let's assume that first statement should be a definition of a function,
   * and the second should be a call to that function.
   * In that case we have to find all identifiers and reference them.
   */
  const [firstStatement, secondStatement] = program.get('body');
  if (
    !firstStatement?.isFunctionDeclaration() ||
    !secondStatement?.isExpressionStatement()
  ) {
    return;
  }

  const functionName = firstStatement.node.id?.name;
  const secondExpression = secondStatement.get('expression');

  if (
    !functionName ||
    !secondExpression.isCallExpression() ||
    !secondExpression.get('callee').isIdentifier({ name: functionName })
  ) {
    return;
  }

  program.traverse({
    Identifier(identifier) {
      if (identifier.node.name !== functionName) return;
      reference(identifier);
    },
  });
}

export default function removeUnusedCode(path: NodePath<Program>) {
  // Some libraries don't care about bindings, references, and other staff
  // So we have to fix the scope before we can detect unused code
  referenceEnums(path);
  referenceIstanbulUsages(path);

  const rootScope = path.scope;
  const removedReferences = new Set<NodePath>();
  function removeUnreferenced(identifiers: string[]) {
    const referenced = new Set<string>();
    identifiers.forEach((item) => {
      const binding = rootScope.getBinding(item);
      if (!binding) return;
      const hasReferences =
        binding.referencePaths.filter((i) => !removedReferences.has(i)).length >
        0;
      if (hasReferences) {
        referenced.add(item);
        return;
      }

      const deletingPath = findParentForDelete(binding.path);

      findIdentifiers([deletingPath]).forEach((identifier) => {
        if (!hasReferences) removedReferences.add(identifier);
        referenced.add(identifier.node.name);
      });
      deletingPath.remove();
    });

    return [...referenced].sort();
  }

  let clean = false;
  let referencedIdentifiers = Object.values(rootScope.bindings)
    .map((binding) => binding.identifier.name)
    .sort();

  while (!clean && referencedIdentifiers.length > 0) {
    const referenced = removeUnreferenced(referencedIdentifiers);
    clean = referenced.join('|') === referencedIdentifiers.join('|');
    referencedIdentifiers = referenced;
  }
}
