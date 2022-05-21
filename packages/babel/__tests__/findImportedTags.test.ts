/* eslint-env jest */
import { join } from 'path';
import * as babel from '@babel/core';
import traverse, { NodePath } from '@babel/traverse';
import dedent from 'dedent';
import { Identifier, Program } from '@babel/types';
import { findImportedTags } from '../src';

function run(code: string) {
  const ast = babel.parse(code, {
    babelrc: false,
    filename: join(__dirname, 'source.js'),
  });

  let usedTags: Map<NodePath<Identifier>, string> | undefined;

  traverse(ast, {
    Program: {
      enter(path: NodePath<Program>) {
        usedTags = findImportedTags(babel, path);
      },
    },
  });

  return [...(usedTags?.entries() ?? [])].map(
    ([path, tag]) => ({
      alias: path.node.name,
      tag,
    }),
    {}
  );
}

describe('findImportedTags', () => {
  it('imports as is from core', () => {
    const usedTags = run(
      dedent`
        import { css, cx } from '@linaria/core';
        import { styled } from '@linaria/react';
      `
    );

    expect(usedTags).toHaveLength(2);
    expect(usedTags[0]).toEqual({ alias: 'css', tag: 'core/css' });
    expect(usedTags[1]).toEqual({ alias: 'styled', tag: 'react/styled' });
  });

  it('imports as is from atomic', () => {
    const usedTags = run(
      dedent`
        import { css, styled } from '@linaria/atomic';
      `
    );

    expect(usedTags).toHaveLength(2);
    expect(usedTags[0]).toEqual({ alias: 'css', tag: 'atomic/css' });
    expect(usedTags[1]).toEqual({ alias: 'styled', tag: 'atomic/styled' });
  });

  it('imports with aliases', () => {
    const usedTags = run(
      dedent`
        import { css as coreCss, cx } from '@linaria/core';
        import { css as atomicCss, styled as atomicStyled } from '@linaria/atomic';
        import { styled as reactStyled } from '@linaria/react';
      `
    );

    expect(usedTags).toHaveLength(4);
    expect(usedTags[0]).toEqual({ alias: 'coreCss', tag: 'core/css' });
    expect(usedTags[1]).toEqual({ alias: 'atomicCss', tag: 'atomic/css' });
    expect(usedTags[2]).toEqual({
      alias: 'atomicStyled',
      tag: 'atomic/styled',
    });
    expect(usedTags[3]).toEqual({ alias: 'reactStyled', tag: 'react/styled' });
  });

  it('import from unknown package', () => {
    const usedTags = run(
      dedent`
        import { css, cx } from '@linaria/unknown';
      `
    );

    expect(usedTags).toHaveLength(0);
  });
});
