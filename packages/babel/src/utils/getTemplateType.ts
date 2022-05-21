import { debug } from '@linaria/logger';
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
  localName: { styled: string; coreCss: string; atomicCss: string },
  has: (identifier: string, sources: string[]) => boolean
): Result {
  const { tag } = path.node;

  // styled(Cmp)``
  if (
    t.isCallExpression(tag) &&
    t.isIdentifier(tag.callee) &&
    tag.arguments.length === 1 &&
    tag.callee.name === localName.styled &&
    has(localName.styled, ['@linaria/react', 'linaria/react'])
  ) {
    const tagPath = path.get('tag') as NodePath<CallExpression>;
    return {
      component: tagPath.get('arguments')[0] as NodePath<Expression>,
    };
  }

  // styled.div``
  if (
    t.isMemberExpression(tag) &&
    t.isIdentifier(tag.object) &&
    t.isIdentifier(tag.property) &&
    tag.object.name === localName.styled &&
    has(localName.styled, ['@linaria/react', 'linaria/react'])
  ) {
    return {
      component: { node: t.stringLiteral(tag.property.name) },
    };
  }

  // css``
  if (
    has(localName.coreCss, ['@linaria/core', 'linaria']) &&
    t.isIdentifier(tag) &&
    tag.name === localName.coreCss
  ) {
    return 'css';
  }

  // css`` but atomic
  if (
    has(localName.atomicCss, ['@linaria/atomic']) &&
    t.isIdentifier(tag) &&
    tag.name === localName.atomicCss
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
    const localName = {
      styled: state.file.metadata.localName?.styled || 'styled',
      coreCss: state.file.metadata.localName?.coreCss || 'css',
      atomicCss: state.file.metadata.localName?.atomicCss || 'css',
    };
    const has = (identifier: string, sources: string[]) =>
      hasImport(
        t,
        path.scope,
        state.file.opts.filename,
        identifier,
        sources,
        libResolver
      );

    const templateType = getTemplateTypeByTag(t, path, localName, has);

    debug('get-template-type:template-type', templateType);

    cache.set(path, getTemplateTypeByTag(t, path, localName, has));
  }

  return cache.get(path) ?? null;
}
