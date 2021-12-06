import type {
  CallExpression,
  Expression,
  TaggedTemplateExpression,
} from '@babel/types';
import type { NodePath } from '@babel/traverse';
import type { State, TemplateExpression, LibResolverFn } from '../types';
import { Core } from '../babel';
import hasImport from './hasImport';

type Result =
  | NonNullable<TemplateExpression['styled']>
  | 'css'
  | 'atomic-css'
  | null;

const cache = new WeakMap<NodePath<TaggedTemplateExpression>, Result>();

export default function getTemplateType(
  { types: t }: Core,
  path: NodePath<TaggedTemplateExpression>,
  state: State,
  libResolver?: LibResolverFn
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
        ['@linaria/react', 'linaria/react'],
        libResolver
      )
    ) {
      const tagPath = path.get('tag') as NodePath<CallExpression>;
      cache.set(path, {
        component: tagPath.get('arguments')[0] as NodePath<Expression>,
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
        ['@linaria/react', 'linaria/react'],
        libResolver
      )
    ) {
      cache.set(path, {
        component: { node: t.stringLiteral(tag.property.name) },
      });
    } else if (
      hasImport(
        t,
        path.scope,
        state.file.opts.filename,
        'css',
        ['@linaria/core', 'linaria'],
        libResolver
      ) &&
      t.isIdentifier(tag) &&
      tag.name === 'css'
    ) {
      cache.set(path, 'css');
    } else if (
      hasImport(
        t,
        path.scope,
        state.file.opts.filename,
        'css',
        ['@linaria/atomic'],
        libResolver
      ) &&
      t.isIdentifier(tag) &&
      tag.name === 'css'
    ) {
      cache.set(path, 'atomic-css');
    } else {
      cache.set(path, null);
    }
  }

  return cache.get(path) ?? null;
}
