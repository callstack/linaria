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

function getTemplateTypeByTag(
  t: Core['types'],
  path: NodePath<TaggedTemplateExpression>,
  localName: string,
  has: (identifier: string, sources: string[]) => boolean
): Result {
  const { tag } = path.node;

  // styled(Cmp)``
  if (
    t.isCallExpression(tag) &&
    t.isIdentifier(tag.callee) &&
    tag.arguments.length === 1 &&
    tag.callee.name === localName &&
    (has(localName, ['@linaria/react', 'linaria/react']) ||
      has(localName, ['@linaria/atomic']))
  ) {
    const tagPath = path.get('tag') as NodePath<CallExpression>;
    return {
      component: tagPath.get('arguments')[0] as NodePath<Expression>,
      type: has(localName, ['@linaria/atomic']) ? 'atomic-styled' : 'styled',
    };
  }

  // styled.div``
  if (
    t.isMemberExpression(tag) &&
    t.isIdentifier(tag.object) &&
    t.isIdentifier(tag.property) &&
    tag.object.name === localName &&
    (has(localName, ['@linaria/react', 'linaria/react']) ||
      has(localName, ['@linaria/atomic']))
  ) {
    return {
      component: { node: t.stringLiteral(tag.property.name) },
      type: has(localName, ['@linaria/atomic']) ? 'atomic-styled' : 'styled',
    };
  }

  // css``
  if (
    has('css', ['@linaria/core', 'linaria']) &&
    t.isIdentifier(tag) &&
    tag.name === 'css'
  ) {
    return 'css';
  }

  // css`` but atomic
  if (
    has('css', ['@linaria/atomic']) &&
    t.isIdentifier(tag) &&
    tag.name === 'css'
  ) {
    return 'atomic-css';
  }

  return null;
}

const cache = new WeakMap<NodePath<TaggedTemplateExpression>, Result>();

export default function getTemplateType(
  { types: t }: Core,
  path: NodePath<TaggedTemplateExpression>,
  state: State,
  libResolver?: LibResolverFn
): Result {
  if (!cache.has(path)) {
    const localName = state.file.metadata.localName || 'styled';
    const has = (identifier: string, sources: string[]) =>
      hasImport(
        t,
        path.scope,
        state.file.opts.filename,
        identifier,
        sources,
        libResolver
      );

    cache.set(path, getTemplateTypeByTag(t, path, localName, has));
  }

  return cache.get(path) ?? null;
}
