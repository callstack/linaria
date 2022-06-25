/**
 * This file is a visitor that checks TaggedTemplateExpressions and look for Linaria css or styled templates.
 * For each template it makes a list of dependencies, try to evaluate expressions, and if it is not possible, mark them as lazy dependencies.
 */

import { statement } from '@babel/template';
import type { NodePath } from '@babel/traverse';
import type {
  Expression,
  Identifier as IdentifierNode,
  Statement,
  TaggedTemplateExpression,
  TemplateElement,
  TSType,
  VariableDeclaration,
} from '@babel/types';

import hasMeta from '@linaria/core/processors/utils/hasMeta';
import { debug } from '@linaria/logger';

import type { StrictOptions, ExpressionValue } from '../types';
import { ValueType } from '../types';

import findIdentifiers, { findAllIdentifiersIn } from './findIdentifiers';
import getSource from './getSource';
import type { IState } from './getTagProcessor';
import { dereference, reference } from './scopeHelpers';
import valueToLiteral from './vlueToLiteral';

type Options = Pick<
  StrictOptions,
  'classNameSlug' | 'displayName' | 'evaluate'
>;

const expressionDeclarationTpl = statement(
  'const %%expId%% = /*#__PURE__*/ () => %%expression%%',
  {
    preserveComments: true,
  }
);

function moveDeclarationBefore(
  declaration: NodePath<VariableDeclaration>,
  target: NodePath<Statement>
) {
  const { scope } = target;
  const { node } = declaration;
  const declaredIdentifiers = findAllIdentifiersIn(declaration, 'id');
  const references: NodePath[] = [];
  declaredIdentifiers.forEach((path) => {
    references.push(
      ...(path.scope.getBinding(path.node.name)?.referencePaths ?? [])
    );
  });

  declaration.remove();
  const [newDeclaration] = target.insertBefore([node]);
  scope.registerDeclaration(newDeclaration);

  references.forEach((path) => {
    if (path.isIdentifier()) {
      reference(path);
    }
  });
}

function hoistVariableDeclaration(
  ex: NodePath<VariableDeclaration>,
  keepName = false
) {
  const referencedIdentifiers = findAllIdentifiersIn(ex, 'init');
  const declaredIdentifiers = findAllIdentifiersIn(ex, 'id');

  const rootStatement = ex.findParent((p) =>
    p.parentPath!.isProgram()
  )! as NodePath<Statement>;

  if (!keepName) {
    declaredIdentifiers.forEach((path) => {
      const newName = path.scope.generateUid('ref');
      path.scope.rename(path.node.name, newName);
    });
  }

  referencedIdentifiers.forEach((identifier) => {
    const binding = identifier.scope.getBinding(identifier.node.name);
    if (!binding || !binding.scope.parent) {
      // This is a global variable, we don't need to hoist it.
      return;
    }

    if (!['var', 'let', 'const'].includes(binding.kind)) {
      // This is not a variable, we can't hoist it
      throw binding.path.buildCodeFrameError(
        'Function parameters cannot be referenced in a Linaria template.'
      );
    }

    const declaration = binding?.path.parentPath;

    if (declaration?.isVariableDeclaration()) {
      hoistVariableDeclaration(declaration);
    }
  });

  moveDeclarationBefore(ex, rootStatement);
}

/**
 * Hoist the node and its dependencies to the root scope
 */
export function hoistExpression(
  ex: NodePath<Expression>
): NodePath<Expression> {
  const Identifier = (idPath: NodePath<IdentifierNode>) => {
    if (!idPath.isReferenced()) {
      return;
    }
    const binding = idPath.scope.getBinding(idPath.node.name);
    if (!binding) return;
    const { scope, path: bindingPath } = binding;
    // parent here can be null or undefined in different versions of babel
    if (!scope.parent) {
      // It's a variable from global scope
      return;
    }

    if (bindingPath.isVariableDeclarator()) {
      const parent = bindingPath.parentPath;
      if (parent.isVariableDeclaration()) {
        const keepName = Boolean(parent.getData('isLinariaTemplateExpression'));
        hoistVariableDeclaration(parent, keepName);
      }

      const init = bindingPath.get('init');
      if (init.isExpression()) {
        hoistExpression(init);
      }
    }
  };

  if (ex.isIdentifier()) {
    Identifier(ex);
    return ex;
  }

  ex.traverse({
    Identifier,
  });

  return ex;
}

function staticEval(
  ex: NodePath<Expression>,
  options: Options
): [unknown] | undefined {
  if (!options.evaluate) return undefined;

  const result = ex.evaluate();
  if (result.confident && !hasMeta(result.value)) {
    return [result.value];
  }

  return undefined;
}

export function extractExpression(
  ex: NodePath<Expression>,
  source: string,
  options: Options
): Omit<ExpressionValue, 'buildCodeFrameError'> {
  const { loc } = ex.node;

  const firstParentStatement = ex.findParent((p) => p.isStatement())!;

  const isFunction =
    ex.isFunctionExpression() || ex.isArrowFunctionExpression();
  const expId = firstParentStatement.scope.generateUidIdentifier('exp');

  const evaluated = staticEval(ex, options);

  // If expression has other identifiers, try to evaluate them
  findIdentifiers([ex]).forEach((id) => {
    const evaluatedId = staticEval(id, options);
    if (evaluatedId) {
      dereference(id);
      id.replaceWith(valueToLiteral(evaluatedId[0], ex));
    }
  });

  const kind = isFunction ? ValueType.FUNCTION : ValueType.LAZY;

  const declaration = expressionDeclarationTpl({
    expId,
    expression: evaluated ? valueToLiteral(evaluated[0], ex) : ex.node,
  });

  const [inserted] = firstParentStatement.insertBefore(declaration);
  firstParentStatement.scope.registerDeclaration(inserted);
  inserted.setData('isLinariaTemplateExpression', true);

  if (ex.isIdentifier()) {
    dereference(ex);
  }

  ex.replaceWith(expId);

  hoistExpression(ex);

  // eslint-disable-next-line no-param-reassign
  ex.node.loc = loc;

  return {
    kind,
    ex: expId,
    source,
  };
}

export default function collectTemplateDependencies(
  path: NodePath<TaggedTemplateExpression>,
  state: IState,
  options: Options
): [quasis: TemplateElement[], expressionValues: ExpressionValue[]] {
  const quasi = path.get('quasi');
  const quasis = quasi.get('quasis');
  const expressions = quasi.get('expressions');

  debug('template-parse:identify-expressions', expressions.length);

  const expressionValues: ExpressionValue[] = expressions.map(
    (ex: NodePath<Expression | TSType>): ExpressionValue => {
      const buildCodeFrameError = ex.buildCodeFrameError.bind(ex);
      const source = getSource(ex);

      if (!ex.isExpression()) {
        throw buildCodeFrameError(
          `The expression '${source}' is not supported.`
        );
      }

      const extracted = extractExpression(ex, source, options);

      return {
        ...extracted,
        buildCodeFrameError,
      };
    }
  );

  return [quasis.map((p) => p.node), expressionValues];
}
