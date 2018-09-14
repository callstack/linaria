/* @flow */

import path from 'path';

import type { NodePath } from '../types';

export function getSelfBinding(nodePath: NodePath<any>) {
  return nodePath.scope.getBinding(nodePath.node.name);
}

export function relativeToCwd(filename: string): string {
  return path.isAbsolute(filename)
    ? path.relative(process.cwd(), filename)
    : filename;
}

export function makeAbsolute(filename: string): string {
  return path.isAbsolute(filename) ? filename : path.resolve(filename);
}
