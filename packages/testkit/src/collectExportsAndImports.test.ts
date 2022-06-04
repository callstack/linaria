/* eslint-env jest */
import { join } from 'path';

import * as babel from '@babel/core';
import type { NodePath } from '@babel/traverse';
import traverse from '@babel/traverse';
import type { Program } from '@babel/types';
import dedent from 'dedent';
import * as ts from 'typescript';

import { collectExportsAndImports } from '@linaria/babel-preset';
import type { IImport, IState } from '@linaria/babel-preset';

function typescriptCommonJS(source: string): string {
  const result = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });

  return result.outputText;
}

function babelCommonJS(source: string): string {
  const result = babel.transformSync(source, {
    babelrc: false,
    filename: join(__dirname, 'source.ts'),
    presets: [
      [
        require.resolve('@babel/preset-env'),
        {
          targets: 'ie 11',
        },
      ],
      '@babel/preset-typescript',
    ],
  });

  return result?.code ?? '';
}

function babelNode16(source: string): string {
  const result = babel.transformSync(source, {
    babelrc: false,
    filename: join(__dirname, 'source.ts'),
    presets: [
      [
        '@babel/preset-typescript',
        {
          onlyRemoveTypeImports: true,
        },
      ],
    ],
  });

  return result?.code ?? '';
}

const compilers: [name: string, compiler: (code: string) => string][] = [
  ['as is', babelNode16],
  ['babelCommonJS', babelCommonJS],
  ['typescriptCommonJS', typescriptCommonJS],
];

function run(compiler: (code: string) => string, code: string) {
  const compiled = compiler(code);
  const filename = join(__dirname, 'source.ts');
  expect(compiled).toMatchSnapshot('compiled with');

  const ast = babel.parse(compiled, {
    babelrc: false,
    filename,
  });

  let collected: IState | undefined;

  traverse(ast, {
    Program: {
      enter(path: NodePath<Program>) {
        collected = collectExportsAndImports(path, filename);
      },
    },
  });

  return (
    collected ?? {
      imports: [],
      exports: [],
    }
  );
}

const safeResolve = (name: string): string => {
  try {
    return require.resolve(name);
  } catch (e: unknown) {
    return name;
  }
};

const findBySource = (imports: IImport[], source: string) => {
  const resolved = safeResolve(source);
  return imports
    .filter((item) => item.source === resolved)
    .map((item) => item.imported)
    .sort();
};

describe.each(compilers)('collectExportsAndImports (%s)', (name, compiler) => {
  it('imports', () => {
    const { imports } = run(
      compiler,
      dedent`
        import unknownDefault, { unknown, another as unknownRenamed } from 'unknown-package';
        import type types from '@linaria/types';
        import atomic from '@linaria/atomic';
        import * as ns from '@linaria/namespace';
        import * as linaria from '@linaria/core';
        import {
          test,
          another as customName,
          type Styled
        } from '@linaria/react';

        const { only, few, fields } = linaria;

        const bar = linaria.bar;

        export { unknownDefault, unknown, unknownRenamed, types, atomic, ns, test, customName, Styled, only, few, fields, bar };
      `
    );

    expect(imports).toHaveLength(11);

    const find = (source: string) => findBySource(imports, source);

    expect(find('unknown-package')).toEqual(['=', 'another', 'unknown']);

    expect(find('@linaria/types')).toHaveLength(0);

    expect(find('@linaria/namespace')).toEqual(['*']);

    expect(find('@linaria/atomic')).toEqual(['=']);

    expect(find('@linaria/core')).toEqual(['bar', 'few', 'fields', 'only']);

    expect(find('@linaria/react')).toEqual(['another', 'test']);
  });

  it('requires', () => {
    const { imports } = run(
      compiler,
      dedent`
        const notModule = (() => {
          const require = () => ({});
          const { dep } = require('@linaria/shaker');
          return result;
        })();
        const module = (() => {
          const { dep } = require('@linaria/something');
          return result;
        })();
        const fullNamespace = require('@linaria/shaker');
        const { named } = require('@linaria/shaker');
        const { ...unknownRest } = require('@linaria/unknown');

        export { notModule, module, fullNamespace, named, unknownRest };
      `
    );

    const find = (source: string) => findBySource(imports, source);

    expect(imports).toHaveLength(4);

    expect(find('@linaria/something')).toEqual(['dep']);
    expect(find('@linaria/shaker')).toEqual(['*', 'named']);
    expect(find('@linaria/unknown')).toEqual(['*']);
  });

  xit('dynamic imports', () => {
    const { imports } = run(
      compiler,
      dedent`
        const fullNamespace = import('@linaria/shaker');
        const { named } = await import('@linaria/shaker');
        const { ...unknownRest } = await import('@linaria/unknown');

        export { fullNamespace, named, unknownRest };
      `
    );

    const find = (source: string) => findBySource(imports, source);

    expect(imports).toHaveLength(3);

    expect(find('@linaria/shaker')).toEqual(['*', 'named']);
    expect(find('@linaria/unknown')).toEqual(['*']);
  });

  xit('exports', () => {
    const { exports } = run(
      compiler,
      dedent`
        const a = 1;

        export { a };

        export const b = 2;

        export default function () {};
      `
    );

    expect(exports.map((i) => i.exported)).toHaveLength(4);

    // expect(find('@linaria/something')).toEqual(['dep']);
    // expect(find('@linaria/shaker')).toEqual(['*', 'named']);
    // expect(find('@linaria/unknown')).toEqual(['*']);
  });

  xit('re-exports', () => {
    const { exports } = run(
      compiler,
      dedent`
        export * from "module1";
        export * as name7 from "module2";
        export { name8, name9, name10 } from "module3";
        export { import1 as name11, import2 as name12, name13 } from "module4";
        export { default } from "module5";
      `
    );

    expect(exports).toHaveLength(4);

    // expect(find('@linaria/something')).toEqual(['dep']);
    // expect(find('@linaria/shaker')).toEqual(['*', 'named']);
    // expect(find('@linaria/unknown')).toEqual(['*']);
  });
});
