/* eslint-env jest */
import { join } from 'path';
import * as babel from '@babel/core';
import type { NodePath } from '@babel/traverse';
import traverse from '@babel/traverse';
import dedent from 'dedent';
import type { Program } from '@babel/types';
import * as ts from 'typescript';
import collectExportsAndImports from '../src/utils/collectExportsAndImports';
import type { IImport, IState } from '../src/utils/collectExportsAndImports';

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
    ],
  });

  return result?.code ?? '';
}

const compilers: [name: string, compiler: (code: string) => string][] = [
  ['as is', (code) => code],
  ['babelCommonJS', babelCommonJS],
  ['typescriptCommonJS', typescriptCommonJS],
];

function run(
  code: string,
  check: (results: IState, compilerName: string) => void
) {
  for (const [name, compiler] of compilers) {
    const compiled = compiler(code);
    expect(compiled).toMatchSnapshot(`compiled with "${name}"`);

    const ast = babel.parse(compiled, {
      babelrc: false,
      filename: join(__dirname, 'source.ts'),
    });

    let collected: IState | undefined;

    traverse(ast, {
      Program: {
        enter(path: NodePath<Program>) {
          collected = collectExportsAndImports(path);
        },
      },
    });

    check(collected!, name);
  }
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

describe('collectExportsAndImports', () => {
  it('imports', () => {
    run(
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
      `,
      ({ imports }) => {
        expect(imports).toHaveLength(11);

        const find = (source: string) => findBySource(imports, source);

        expect(find('unknown-package')).toEqual(['=', 'another', 'unknown']);

        expect(find('@linaria/types')).toHaveLength(0);

        expect(find('@linaria/namespace')).toEqual(['*']);

        expect(find('@linaria/atomic')).toEqual(['=']);

        expect(find('@linaria/core')).toEqual(['bar', 'few', 'fields', 'only']);

        expect(find('@linaria/react')).toEqual(['another', 'test']);
      }
    );
  });

  it('dynamic imports', () => {
    run(
      dedent`
        const fullNamespace = import('@linaria/shaker');
        const { named } = await import('@linaria/shaker');
        const { ...unknownRest } = await import('@linaria/unknown');

        export { fullNamespace, named, unknownRest };
      `,
      ({ imports }) => {
        const find = (source: string) => findBySource(imports, source);

        expect(imports).toHaveLength(3);

        expect(find('@linaria/shaker')).toEqual(['*', 'named']);
        expect(find('@linaria/unknown')).toEqual(['*']);
      }
    );
  });

  it('requires', () => {
    run(
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
      `,
      ({ imports }) => {
        const find = (source: string) => findBySource(imports, source);

        expect(imports).toHaveLength(4);

        expect(find('@linaria/something')).toEqual(['dep']);
        expect(find('@linaria/shaker')).toEqual(['*', 'named']);
        expect(find('@linaria/unknown')).toEqual(['*']);
      }
    );
  });

  it('exports', () => {
    run(
      dedent`
        const a = 1;

        export { a };

        export const b = 2;

        export default function () {};
      `,
      ({ exports }) => {
        expect(exports.map((i) => i.exported)).toHaveLength(4);

        // expect(find('@linaria/something')).toEqual(['dep']);
        // expect(find('@linaria/shaker')).toEqual(['*', 'named']);
        // expect(find('@linaria/unknown')).toEqual(['*']);
      }
    );
  });

  it('re-exports', () => {
    run(
      dedent`
        export * from "module1";
        export * as name7 from "module2";
        export { name8, name9, name10 } from "module3";
        export { import1 as name11, import2 as name12, name13 } from "module4";
        export { default } from "module5";
      `,
      ({ exports }) => {
        expect(exports).toHaveLength(4);

        // expect(find('@linaria/something')).toEqual(['dep']);
        // expect(find('@linaria/shaker')).toEqual(['*', 'named']);
        // expect(find('@linaria/unknown')).toEqual(['*']);
      }
    );
  });
});
