import type { NodePath } from '@babel/traverse';
import type { Identifier, Program } from '@babel/types';
import { Core } from '../babel';

const safeResolve = (name: string) => {
  try {
    return require.resolve(name);
  } catch (e: unknown) {
    return name;
  }
};

const tags = [
  { tag: 'css', package: 'atomic' },
  { tag: 'css', package: 'core' },
  { tag: 'styled', package: 'atomic' },
  { tag: 'styled', package: 'react' },
].reduce((acc: Record<string, string>, { tag, package: pkg }) => {
  const path = safeResolve(`@linaria/${pkg}`);
  if (!path) return acc;
  return {
    ...acc,
    [`${path}#${tag}`]: `${pkg}/${tag}`,
  };
}, {});

/**
 * Finds imports of css and styled tags and returns local identifiers for them.
 * @param t
 * @param program
 */
export default function findImportedTags(
  { types: t }: Core,
  program: NodePath<Program>
) {
  const usedTags = new Map<NodePath<Identifier>, string>();

  program.get('body').forEach((p) => {
    // FIXME: can be imported as `const styled = require('@linaria/react')`
    if (!p.isImportDeclaration()) return;
    const source = p.get('source');
    if (!source.isStringLiteral()) return;
    const value = source.node.value;
    const path = safeResolve(value);

    p.get('specifiers').forEach((specifier) => {
      if (!specifier.isImportSpecifier()) return;
      const { imported } = specifier.node;
      if (!t.isIdentifier(imported)) return;
      const tagKey = `${path}#${imported.name}`;
      if (!(tagKey in tags)) return;
      usedTags.set(specifier.get('local'), tags[tagKey]);
    });
  });

  return usedTags;
}
