/* eslint-disable no-restricted-syntax */
/* eslint @typescript-eslint/no-use-before-define: ["error", { "functions": false }] */

import type { Binding, NodePath } from '@babel/traverse';
import type {
  FieldOptions,
  Function as FunctionNode,
  Identifier,
  JSXIdentifier,
  Node,
  Program,
} from '@babel/types';
import { NODE_FIELDS } from '@babel/types';

import findIdentifiers, { nonType } from './findIdentifiers';
import { getScope } from './getScope';
import isNotNull from './isNotNull';
import isRemoved from './isRemoved';

function validateField(
  node: Node,
  key: string,
  val: unknown,
  field: FieldOptions
) {
  if (!(field != null && field.validate)) return true;
  if (field.optional && val == null) return true;
  try {
    field.validate(node, key, val);
    return true;
  } catch {
    return false;
  }
}

function getBinding(path: NodePath<Identifier | JSXIdentifier>) {
  const binding = getScope(path).getBinding(path.node.name);
  if (!binding) {
    return undefined;
  }

  return binding;
}

export function reference(
  path: NodePath<Identifier | JSXIdentifier>,
  referencePath: NodePath = path,
  force = false
): void {
  if (!force && !path.isReferencedIdentifier()) return;

  const binding = getBinding(path);
  if (!binding) return;

  if (binding.referencePaths.includes(referencePath)) {
    return;
  }

  binding.referenced = true;
  binding.referencePaths.push(referencePath ?? path);
  binding.references = binding.referencePaths.length;
}

function isReferenced({ kind, referenced, referencePaths }: Binding) {
  if (!referenced) {
    return false;
  }

  // If it's a param binding, we can't just remove it
  // because it brakes the function signature. Keep it alive for now.
  if ((kind as string) === 'param') {
    return true;
  }

  // If all remaining references are in TS/Flow types, binding is unreferenced
  return (
    referencePaths.length > 0 ||
    referencePaths.every((i) =>
      i.find((ancestor) => ancestor.isTSType() || ancestor.isFlowType())
    )
  );
}

function isReferencedConstantViolation(path: NodePath, binding: Binding) {
  if (path.find((p) => p === binding.path)) {
    // function a(flag) { return (a = function(flag) { flag ? 1 : 2 }) }
    // ^ Looks crazy, yeh? Welcome to the wonderful world of transpilers!
    // `a = …` here isn't a reference.
    return false;
  }

  if (!path.isReferenced()) {
    return false;
  }

  if (
    path.isAssignmentExpression() &&
    path.parentPath.isExpressionStatement()
  ) {
    // A root assignment without a parent expression statement is not a reference
    return false;
  }

  return true;
}

export function dereference(
  path: NodePath<Identifier | JSXIdentifier>
): Binding | null {
  const binding = getBinding(path);
  if (!binding) return null;

  const isReference = binding.referencePaths.includes(path);
  let referencesInConstantViolations = binding.constantViolations.filter((i) =>
    isReferencedConstantViolation(i, binding)
  );

  const isConstantViolation = referencesInConstantViolations.includes(path);

  if (!isReference && !isConstantViolation) {
    return null;
  }

  if (isReference) {
    binding.referencePaths = binding.referencePaths.filter((i) => i !== path);
    binding.references -= 1;
  } else {
    referencesInConstantViolations = referencesInConstantViolations.filter(
      (i) => i !== path
    );
  }

  const nonTypeReferences = binding.referencePaths.filter(nonType);
  binding.referenced =
    nonTypeReferences.length + referencesInConstantViolations.length > 0;

  return binding;
}

function dereferenceAll(path: NodePath): Binding[] {
  return findIdentifiers([path])
    .map((identifierPath) => dereference(identifierPath))
    .filter(isNotNull);
}

export function referenceAll(path: NodePath): void {
  findIdentifiers([path]).forEach((identifierPath) =>
    reference(identifierPath)
  );
}

const deletingNodes = new WeakSet<NodePath>();

const isEmptyList = (list: NodePath[]) =>
  list.length === 0 || list.every((i) => deletingNodes.has(i));

type ReplaceAction = [action: 'replace', what: NodePath, by: Node];
type RemoveAction = [action: 'remove', what: NodePath];

const getPathFromAction = (action: RemoveAction | ReplaceAction) => {
  if (!Array.isArray(action)) {
    return action;
  }

  if (action[0] === 'replace' || action[0] === 'remove') {
    return action[1];
  }

  throw new Error(`Unknown action type: ${action[0]}`);
};

function canFunctionBeDelete(fnPath: NodePath<FunctionNode>) {
  const fnScope = fnPath.scope;
  const parentScope = fnScope.parent;
  if (parentScope.parent) {
    // It isn't a top-level function, so we can't delete it
    return true;
  }

  if (fnPath.listKey === 'arguments') {
    // It is passed as an argument to another function, we can't delete it
    return true;
  }

  return false;
}

export function findActionForNode(
  path: NodePath
): RemoveAction | ReplaceAction | null {
  if (isRemoved(path)) return null;

  deletingNodes.add(path);

  const parent = path.parentPath;

  if (!parent) return ['remove', path];

  if (parent.isProgram()) {
    // Do not delete Program node
    return ['remove', path];
  }

  if (parent.isFunction()) {
    if (path.listKey === 'params') {
      // Do not remove params of functions
      return null;
    }

    if (
      (path.isBlockStatement() && isEmptyList(path.get('body'))) ||
      path === parent.get('body')
    ) {
      if (!canFunctionBeDelete(parent)) {
        return [
          'replace',
          parent,
          {
            ...parent.node,
            async: false,
            body: {
              type: 'BlockStatement',
              body: [],
              directives: [],
            },
            generator: false,
            params: [],
          },
        ];
      }
    }
  }

  if (parent.isLogicalExpression({ operator: '&&' })) {
    return [
      'replace',
      parent,
      {
        type: 'BooleanLiteral',
        value: false,
      },
    ];
  }

  if (parent.isObjectProperty()) {
    // let's check if it is a special case with Object.defineProperty
    const key = parent.get('key');
    if (key.isIdentifier({ name: 'get' })) {
      const maybeDefineProperty = parent.parentPath.parentPath;
      if (
        maybeDefineProperty?.isCallExpression() &&
        maybeDefineProperty
          .get('callee')
          .matchesPattern('Object.defineProperty')
      ) {
        return findActionForNode(maybeDefineProperty);
      }
    }

    return findActionForNode(parent);
  }

  if (parent.isTemplateLiteral()) {
    return [
      'replace',
      path,
      {
        type: 'StringLiteral',
        value: '',
      },
    ];
  }

  if (parent.isAssignmentExpression()) {
    return findActionForNode(parent);
  }

  if (parent.isCallExpression()) {
    return findActionForNode(parent);
  }

  if (parent.isForInStatement({ left: path.node })) {
    return findActionForNode(parent);
  }

  if (
    parent.isFunctionExpression({ body: path.node }) ||
    parent.isFunctionDeclaration() ||
    parent.isObjectMethod() ||
    parent.isClassMethod()
  ) {
    return findActionForNode(parent);
  }

  if (parent.isBlockStatement()) {
    const body = parent.get('body');
    if (isEmptyList(body)) {
      return findActionForNode(parent);
    }

    if (path.listKey === 'body' && typeof path.key === 'number') {
      if (path.key > 0) {
        // We can check whether the previous one can be removed
        const prevStatement = body[path.key - 1];
        if (
          prevStatement.isIfStatement() &&
          prevStatement.get('consequent').isReturnStatement()
        ) {
          // It's `if (…) return …`, we can remove it.
          return findActionForNode(prevStatement);
        }
      } else if (
        body.slice(1).every((statement) => deletingNodes.has(statement))
      ) {
        // If it is the first statement and all other statements
        // are marked for deletion, we can remove the whole block.
        return findActionForNode(parent);
      }
    }
  }

  if (parent.isVariableDeclarator()) {
    return findActionForNode(parent);
  }

  if (
    parent.isExportNamedDeclaration() &&
    ((path.key === 'specifiers' && isEmptyList(parent.get('specifiers'))) ||
      (path.key === 'declaration' && parent.node.declaration === path.node))
  ) {
    return findActionForNode(parent);
  }

  for (const key of ['body', 'declarations', 'specifiers']) {
    if (path.listKey === key && typeof path.key === 'number') {
      const list = parent.get(key) as NodePath[];
      if (isEmptyList(list)) {
        return findActionForNode(parent);
      }
    }
  }

  if (parent.isTryStatement()) {
    return findActionForNode(parent);
  }

  if (!path.listKey) {
    const field = NODE_FIELDS[parent.type][path.key];
    if (!validateField(parent.node, path.key as string, null, field)) {
      // The parent node isn't valid without this field, so we should remove it also.
      return findActionForNode(parent);
    }
  }

  for (const key of [
    'argument',
    'block',
    'body',
    'callee',
    'discriminant',
    'expression',
    'id',
    'left',
    'object',
    'property',
    'right',
    'test',
  ]) {
    if (path.key === key && parent.get(key) === path) {
      return findActionForNode(parent);
    }
  }

  return ['remove', path];
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

const fixed = new WeakSet<NodePath<Program>>();

function removeUnreferenced(items: NodePath<Identifier | JSXIdentifier>[]) {
  const referenced = new Set<NodePath<Identifier | JSXIdentifier>>();
  items.forEach((item) => {
    if (!item.node || isRemoved(item)) return;
    const binding = getScope(item).getBinding(item.node.name);
    if (!binding) return;
    const hasReferences =
      binding.referencePaths.filter((i) => !isRemoved(i)).length > 0;
    if (hasReferences) {
      referenced.add(item);
      return;
    }

    const forDeleting = [binding.path, ...binding.constantViolations]
      .map(findActionForNode)
      .filter(isNotNull)
      .map(getPathFromAction);

    if (forDeleting.length === 0) return;

    findIdentifiers(forDeleting).forEach((identifier) => {
      referenced.add(identifier);
    });

    removeWithRelated(forDeleting);
  });

  const result = [...referenced];
  result.sort((a, b) => a.node?.name.localeCompare(b.node?.name));

  return result;
}

function applyAction(action: ReplaceAction | RemoveAction) {
  mutate(action[1], (p) => {
    if (isRemoved(p)) return;

    if (action[0] === 'remove') {
      p.remove();
    }

    if (action[0] === 'replace') {
      p.replaceWith(action[2]);
    }
  });
}

function removeWithRelated(paths: NodePath[]) {
  if (paths.length === 0) return;

  const rootPath = getScope(paths[0]).getProgramParent()
    .path as NodePath<Program>;

  if (!fixed.has(rootPath)) {
    // Some libraries don't care about bindings, references, and other staff
    // So we have to fix the scope before we can detect unused code
    referenceEnums(rootPath);
    fixed.add(rootPath);
  }

  const actions: (ReplaceAction | RemoveAction)[] = paths
    .map(findActionForNode)
    .filter(isNotNull);

  const affectedPaths = actions.map(getPathFromAction);

  let referencedIdentifiers = findIdentifiers(affectedPaths, 'referenced');
  referencedIdentifiers.sort((a, b) =>
    a.node?.name.localeCompare(b.node?.name)
  );

  const referencesOfBinding = findIdentifiers(affectedPaths, 'binding')
    .map((i) => (i.node && getScope(i).getBinding(i.node.name)) ?? null)
    .filter(isNotNull)
    .reduce(
      (acc, i) => [...acc, ...i.referencePaths.filter(nonType)],
      [] as NodePath[]
    );

  actions.forEach(applyAction);

  removeWithRelated(referencesOfBinding);

  let clean = false;
  while (!clean && referencedIdentifiers.length > 0) {
    const referenced = removeUnreferenced(referencedIdentifiers);
    clean =
      referenced.map((i) => i.node?.name).join('|') ===
      referencedIdentifiers.map((i) => i.node?.name).join('|');
    referencedIdentifiers = referenced;
  }
}

function mutate<T extends NodePath>(path: T, fn: (p: T) => NodePath[] | void) {
  const dereferenced = dereferenceAll(path);

  const mutated = fn(path);

  referenceAll(path);
  mutated?.forEach((p) => referenceAll(p));

  const dead = dereferenced.filter((p) => !isReferenced(p));

  const forDeleting: NodePath[] = [];
  dead.forEach((binding) => {
    const assignments = [binding.path, ...binding.constantViolations];
    assignments.forEach((assignment) => {
      const { scope } = assignment;
      const declared = Object.values(
        assignment.getOuterBindingIdentifiers(false)
      );
      if (
        declared.length === 1 &&
        'name' in declared[0] &&
        declared[0].name === binding.identifier.name
      ) {
        // Only one identifier is declared, so we can remove the whole declaration
        forDeleting.push(assignment);
        return;
      }

      if (
        declared.every(
          (identifier) =>
            identifier.type === 'Identifier' &&
            !scope.getBinding(identifier.name)?.referenced
        )
      ) {
        // No other identifier is referenced, so we can remove the whole declaration
        forDeleting.push(assignment);
        return;
      }

      // We can't remove the binding, but we can remove the part of it
      assignment.traverse({
        Identifier(identifier) {
          if (identifier.node.name === binding.identifier.name) {
            const parent = identifier.parentPath;
            if (
              parent.isArrayPattern() &&
              identifier.listKey === 'elements' &&
              typeof identifier.key === 'number'
            ) {
              parent.node.elements[identifier.key] = null;
            } else if (parent.isObjectProperty()) {
              forDeleting.push(parent);
            }
          }
        },
      });
    });
  });

  removeWithRelated(forDeleting);
}

export { applyAction, mutate, removeWithRelated };
