/* @flow */

import type {
  BabelTypes,
  NodePath,
  BabelTaggedTemplateExpression,
} from '../types';

import { getSelfBinding } from './utils';

export function isLinariaTaggedTemplate(
  types: BabelTypes,
  path: NodePath<BabelTaggedTemplateExpression<any>>
): boolean {
  const isCssTagged =
    types.isIdentifier(path.node.tag) && path.node.tag.name === 'css';
  const isCssNamedTagged =
    (types.isCallExpression(path.node.tag) &&
      types.isMemberExpression(path.node.tag.callee) &&
      path.node.tag.callee.object.name === 'css' &&
      path.node.tag.callee.property.name === 'named') ||
    (types.isMemberExpression(path.node.tag) &&
      path.node.tag.object.name === 'css' &&
      path.node.tag.property.name === 'named');
  const hasArguments =
    isCssNamedTagged &&
    types.isCallExpression(path.node.tag) &&
    path.node.tag.arguments.length;

  if (isCssTagged || (isCssNamedTagged && hasArguments)) {
    return true;
  }

  if (isCssNamedTagged && !hasArguments) {
    throw new Error("Linaria's `css.named` must be called with a class name");
  }

  return false;
}

export function shouldTraverseExternalIds(path: NodePath<any>) {
  if (path.isImportDefaultSpecifier() || path.isImportSpecifier()) {
    return false;
  }

  return true;
}

export function isExcluded(path: NodePath<*>): boolean {
  const binding = getSelfBinding(path);
  return binding && binding.kind === 'param';
}
