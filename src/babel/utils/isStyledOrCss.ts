import { types as t } from '@babel/core';
import { NodePath } from '@babel/traverse';
import { State, TemplateExpression } from '../types';
import hasImport from './hasImport';

type Result = NonNullable<TemplateExpression['styled']> | 'css' | null;

const cache = new WeakMap<NodePath<t.TaggedTemplateExpression>, Result>();

export default function isStyledOrCss(
  path: NodePath<t.TaggedTemplateExpression>,
  state: State
): Result {
  if (!cache.has(path)) {
    const { tag } = path.node;

    const localName = state.file.metadata.localName || 'styled';

    if (
      t.isCallExpression(tag) &&
      t.isIdentifier(tag.callee) &&
      tag.arguments.length === 1 &&
      tag.callee.name === localName &&
      hasImport(
        t,
        path.scope,
        state.file.opts.filename,
        localName,
        'linaria/react'
      )
    ) {
      const tagPath = path.get('tag') as NodePath<t.CallExpression>;
      cache.set(path, {
        component: tagPath.get('arguments')[0] as NodePath<t.Expression>,
      });
    } else if (
      t.isMemberExpression(tag) &&
      t.isIdentifier(tag.object) &&
      t.isIdentifier(tag.property) &&
      tag.object.name === localName &&
      hasImport(
        t,
        path.scope,
        state.file.opts.filename,
        localName,
        'linaria/react'
      )
    ) {
      cache.set(path, {
        component: { node: t.stringLiteral(tag.property.name) },
      });
    } else if (
      hasImport(t, path.scope, state.file.opts.filename, 'css', 'linaria') &&
      t.isIdentifier(tag) &&
      tag.name === 'css'
    ) {
      cache.set(path, 'css');
    } else {
      cache.set(path, null);
    }
  }

  return cache.get(path) ?? null;
}
