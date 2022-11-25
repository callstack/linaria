/* eslint @typescript-eslint/no-use-before-define: ["error", { "functions": false }] */

/**
 * This file is a visitor that checks TaggedTemplateExpressions and look for Linaria css or styled templates.
 * For each template it makes a list of dependencies, try to evaluate expressions, and if it is not possible, mark them as lazy dependencies.
 */

import { statement } from '@babel/template';
import type { NodePath, Scope } from '@babel/traverse';
import type {
  Expression,
  ExpressionStatement,
  Identifier,
  JSXIdentifier,
  ObjectExpression,
  ObjectProperty,
  Program,
  SourceLocation,
  Statement,
  TaggedTemplateExpression,
  TemplateElement,
  TSType,
  VariableDeclaration,
  VariableDeclarator,
} from '@babel/types';
import { cloneNode } from '@babel/types';

import { debug } from '@linaria/logger';
import type { ConstValue } from '@linaria/tags';
import { hasMeta } from '@linaria/tags';
import {
  findIdentifiers,
  mutate,
  reference,
  referenceAll,
} from '@linaria/utils';

import type { ExpressionValue } from '../types';
import { ValueType } from '../types';

import getSource from './getSource';
import valueToLiteral from './vlueToLiteral';

const createId = (name: string, loc?: SourceLocation | null): Identifier => ({
  type: 'Identifier',
  name,
  loc,
});

function staticEval(
  ex: NodePath<Expression>,
  evaluate = false
): [unknown] | undefined {
  if (!evaluate) return undefined;

  const result = ex.evaluate();
  if (result.confident && !hasMeta(result.value)) {
    return [result.value];
  }

  return undefined;
}

const expressionDeclarationTpl = statement(
  'const %%expId%% = /*#__PURE__*/ () => %%expression%%',
  {
    preserveComments: true,
  }
);

const unsupported = (ex: NodePath, reason?: string): Error =>
  ex.buildCodeFrameError(
    `This ${
      ex.isIdentifier() ? 'identifier' : 'expression'
    } cannot be used in the template${reason ? `, because it ${reason}` : ''}.`
  );

function getUidInRootScope(path: NodePath<Identifier | JSXIdentifier>): string {
  const { name } = path.node;
  const rootScope = path.scope.getProgramParent();
  if (rootScope.hasBinding(name)) {
    return rootScope.generateUid(name);
  }

  return name;
}

function hoistVariableDeclarator(ex: NodePath<VariableDeclarator>) {
  if (!ex.scope.parent) {
    // It is already in the root scope
    return;
  }

  const referencedIdentifiers = findIdentifiers([ex], 'referenced');
  referencedIdentifiers.forEach((identifier) => {
    if (identifier.isIdentifier()) {
      hoistIdentifier(identifier);
    }
  });

  const bindingIdentifiers = findIdentifiers([ex], 'binding');

  bindingIdentifiers.forEach((path) => {
    const newName = getUidInRootScope(path);
    if (newName !== path.node.name) {
      path.scope.rename(path.node.name, newName);
    }
  });

  const rootScope = ex.scope.getProgramParent();

  const statementInRoot = ex.findParent(
    (p) => p.parentPath?.isProgram() === true
  ) as NodePath<Statement>;

  const declaration: VariableDeclaration = {
    type: 'VariableDeclaration',
    kind: 'let',
    declarations: [cloneNode(ex.node)],
  };

  const [inserted] = statementInRoot.insertBefore(declaration);
  referenceAll(inserted);
  rootScope.registerDeclaration(inserted);
}

function hoistIdentifier(idPath: NodePath<Identifier>): void {
  if (!idPath.isReferenced()) {
    throw unsupported(idPath);
  }

  const binding = idPath.scope.getBinding(idPath.node.name);
  if (!binding) {
    // It's something strange
    throw unsupported(idPath, 'is undefined');
  }

  if (binding.kind === 'module') {
    // Modules are global by default
    return;
  }

  if (!['var', 'let', 'const', 'hoisted'].includes(binding.kind)) {
    // This is not a variable, we can't hoist it
    throw unsupported(binding.path, 'is a function parameter');
  }

  const { scope, path: bindingPath } = binding;
  // parent here can be null or undefined in different versions of babel
  if (!scope.parent) {
    // The variable is already in the root scope
    return;
  }

  if (bindingPath.isVariableDeclarator()) {
    hoistVariableDeclarator(bindingPath);

    return;
  }

  throw unsupported(idPath);
}

function getOrAddLinariaPreval(scope: Scope): NodePath<ObjectExpression> {
  const rootScope = scope.getProgramParent();
  let object = rootScope.getData('__linariaPreval');
  if (object) {
    return object;
  }

  const prevalExport: ExpressionStatement = {
    type: 'ExpressionStatement',
    expression: {
      type: 'AssignmentExpression',
      operator: '=',
      left: {
        type: 'MemberExpression',
        object: createId('exports'),
        property: createId('__linariaPreval'),
        computed: false,
      },
      right: {
        type: 'ObjectExpression',
        properties: [],
      },
    },
  };

  const programPath = rootScope.path as NodePath<Program>;
  const [inserted] = programPath.pushContainer('body', [prevalExport]);
  object = inserted.get('expression.right') as NodePath<ObjectExpression>;
  rootScope.setData('__linariaPreval', object);
  return object;
}

function addIdentifierToLinariaPreval(scope: Scope, name: string) {
  const rootScope = scope.getProgramParent();
  const object = getOrAddLinariaPreval(rootScope);
  const newProperty: ObjectProperty = {
    type: 'ObjectProperty',
    key: createId(name),
    value: createId(name),
    computed: false,
    shorthand: false,
  };

  const [inserted] = object.pushContainer('properties', [newProperty]);
  reference(inserted.get('value') as NodePath<Identifier>);
}

/**
 * Only an expression that can be evaluated in the root scope can be
 * used in a Linaria template. This function tries to hoist the expression.
 * @param ex The expression to hoist.
 * @param evaluate If true, we try to statically evaluate the expression.
 * @param addToExport If true, we add the expression to the __linariaPreval.
 */
export function extractExpression(
  ex: NodePath<Expression>,
  evaluate = false,
  addToExport = true
): Omit<ExpressionValue, 'buildCodeFrameError' | 'source'> {
  if (
    ex.isLiteral() &&
    ('value' in ex.node || ex.node.type === 'NullLiteral')
  ) {
    return {
      ex: ex.node,
      kind: ValueType.CONST,
      value: ex.node.type === 'NullLiteral' ? null : ex.node.value,
    } as Omit<ConstValue, 'buildCodeFrameError' | 'source'>;
  }

  const { loc } = ex.node;

  const rootScope = ex.scope.getProgramParent();
  const statementInRoot = ex.findParent(
    (p) => p.parentPath?.isProgram() === true
  ) as NodePath<Statement>;

  const isFunction =
    ex.isFunctionExpression() || ex.isArrowFunctionExpression();

  // Generate next _expN name
  const expUid = rootScope.generateUid('exp');

  const evaluated = staticEval(ex, evaluate);

  if (!evaluated) {
    // If expression is not statically evaluable,
    // we need to hoist all its referenced identifiers

    // Collect all referenced identifiers
    findIdentifiers([ex], 'referenced').forEach((id) => {
      if (!id.isIdentifier()) return;

      // Try to evaluate and inline them…
      const evaluatedId = staticEval(id, evaluate);
      if (evaluatedId) {
        mutate(id, (p) => {
          p.replaceWith(valueToLiteral(evaluatedId[0], ex));
        });
      } else {
        // … or hoist them to the root scope
        hoistIdentifier(id);
      }
    });
  }

  const kind = isFunction ? ValueType.FUNCTION : ValueType.LAZY;

  // Declare _expN const with the lazy expression
  const declaration = expressionDeclarationTpl({
    expId: createId(expUid),
    expression: evaluated
      ? valueToLiteral(evaluated[0], ex)
      : cloneNode(ex.node),
  }) as VariableDeclaration;

  // Insert the declaration as close as possible to the original expression
  const [inserted] = statementInRoot.insertBefore(declaration);
  referenceAll(inserted);
  rootScope.registerDeclaration(inserted);

  // Replace the expression with the _expN() call
  mutate(ex, (p) => {
    p.replaceWith({
      type: 'CallExpression',
      callee: createId(expUid),
      arguments: [],
    });
  });

  if (addToExport) {
    addIdentifierToLinariaPreval(rootScope, expUid);
  }

  // eslint-disable-next-line no-param-reassign
  ex.node.loc = loc;

  return {
    kind,
    ex: createId(expUid, loc),
  };
}

/**
 * Collects, hoists, and makes lazy all expressions in the given template
 * If evaluate is true, it will try to evaluate the expressions
 */
export default function collectTemplateDependencies(
  path: NodePath<TaggedTemplateExpression>,
  evaluate = false
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

      const extracted = extractExpression(ex, evaluate);

      return {
        ...extracted,
        source,
        buildCodeFrameError,
      } as ExpressionValue;
    }
  );

  return [quasis.map((p) => p.node), expressionValues];
}
