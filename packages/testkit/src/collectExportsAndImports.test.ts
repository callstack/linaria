/* eslint-env jest */
import { join } from 'path';

import * as babel from '@babel/core';
import generator from '@babel/generator';
import dedent from 'dedent';
import * as ts from 'typescript';

import type { MissedBabelCoreTypes } from '@linaria/babel-preset';
import { collectExportsAndImports } from '@linaria/utils';

const { File } = babel as typeof babel & MissedBabelCoreTypes;

function typescriptCommonJS(source: string): string {
  const result = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });

  return result.outputText;
}

function babelCommonJS(source: string): string {
  const result = babel.transformSync(source, {
    babelrc: false,
    configFile: false,
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
    configFile: false,
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

function runWithCompiler(compiler: (code: string) => string, code: string) {
  const compiled = compiler(code);
  const filename = join(__dirname, 'source.ts');

  const ast = babel.parse(compiled, {
    babelrc: false,
    filename,
  })!;

  const file = new File({ filename }, { code, ast });

  const collected = collectExportsAndImports(file.path, filename);

  const sortImports = (
    a: { imported: string | null; source: string },
    b: { imported: string | null; source: string }
  ): number => {
    if (a.imported === null || b.imported === null) {
      if (a.imported === null && b.imported === null) {
        return a.source.localeCompare(b.source);
      }

      return a.imported === null ? -1 : 1;
    }

    return a.imported.localeCompare(b.imported);
  };

  return {
    exports:
      collected?.exports
        .map(({ local, ...i }) => ({
          ...i,
          local: generator(local.node).code,
        }))
        .sort((a, b) => a.exported.localeCompare(b.exported)) ?? [],
    imports:
      collected?.imports
        .map(({ local, ...i }) => ({
          ...i,
          local: generator(local.node).code,
        }))
        .sort(sortImports) ?? [],
    reexports: collected?.reexports ?? [],
  };
}

describe.each(compilers)('collectExportsAndImports (%s)', (name, compiler) => {
  const run = (code: TemplateStringsArray) =>
    runWithCompiler(compiler, dedent(code));

  describe('import', () => {
    it('default', () => {
      const { imports } = run`
        import unknownDefault from 'unknown-package';

        console.log(unknownDefault);
      `;

      expect(imports).toMatchObject([
        {
          source: 'unknown-package',
          imported: 'default',
        },
      ]);
    });

    it('named', () => {
      const { imports } = run`
        import { named } from 'unknown-package';

        console.log(named);
      `;

      expect(imports).toMatchObject([
        {
          source: 'unknown-package',
          imported: 'named',
        },
      ]);
    });

    it('renamed', () => {
      const { imports } = run`
        import { named as renamed } from 'unknown-package';

        console.log(renamed);
      `;

      expect(imports).toMatchObject([
        {
          source: 'unknown-package',
          imported: 'named',
        },
      ]);
    });

    it('types', () => {
      const { imports } = run`
        import type { Named as Renamed } from 'unknown-package';

        const value: Renamed = 'value';

        console.log(value);
      `;

      expect(imports).toHaveLength(0);
    });

    it('side-effects', () => {
      const { imports } = run`
        import 'unknown-package';
      `;

      expect(imports).toHaveLength(1);
    });

    describe('wildcard', () => {
      it('unclear usage of the imported namespace', () => {
        const { imports } = run`
          import * as ns from 'unknown-package';

          console.log(ns);
        `;

        expect(imports).toMatchObject([
          {
            source: 'unknown-package',
            imported: '*',
          },
        ]);
      });

      it('dynamic usage of the imported namespace', () => {
        const { imports } = run`
          import * as ns from 'unknown-package';

          const key = Math.random() > 0.5 ? 'a' : 'b';

          console.log(ns[key]);
        `;

        expect(imports).toMatchObject([
          {
            source: 'unknown-package',
            imported: '*',
          },
        ]);
      });

      it('clear usage of the imported namespace', () => {
        const { imports } = run`
          import * as ns from 'unknown-package';

          console.log(ns.named, ns['anotherNamed']);
        `;

        expect(imports).toMatchObject([
          {
            source: 'unknown-package',
            imported: 'anotherNamed',
          },
          {
            source: 'unknown-package',
            imported: 'named',
          },
        ]);
      });

      it('destructed namespace', () => {
        const { imports } = run`
          import * as ns from 'unknown-package';

          const { named } = ns;

          console.log(named);
        `;

        expect(imports).toMatchObject([
          {
            source: 'unknown-package',
            imported: 'named',
          },
        ]);
      });

      it('unevaluable usage', () => {
        const { imports } = run`
          import * as ns from 'unknown-package';

          const getNamed = (n) => n.name;
          const named = getNamed(ns);;

          console.log(named);
        `;

        expect(imports).toMatchObject([
          {
            source: 'unknown-package',
            imported: '*',
          },
        ]);
      });
    });
  });

  describe('require', () => {
    it('default', () => {
      const { imports } = run`
        const unknownDefault = require('unknown-package');

        console.log(unknownDefault.default);
      `;

      expect(imports).toMatchObject([
        {
          source: 'unknown-package',
          imported: 'default',
        },
      ]);
    });

    it('named', () => {
      const { imports } = run`
        const namedDefault = require('unknown-package').named;

        console.log(namedDefault);
      `;

      expect(imports).toMatchObject([
        {
          source: 'unknown-package',
          imported: 'named',
        },
      ]);
    });

    it('renamed', () => {
      const { imports } = run`
        const { named: renamed } = require('unknown-package');

        console.log(renamed);
      `;

      expect(imports).toMatchObject([
        {
          source: 'unknown-package',
          imported: 'named',
        },
      ]);
    });

    it('deep', () => {
      const { imports } = run`
        const { very: { deep: { token } } } = require('unknown-package');

        console.log(namedDefault);
      `;

      expect(imports).toMatchObject([
        {
          source: 'unknown-package',
          imported: 'very',
        },
      ]);
    });

    it('two tokens', () => {
      const { imports } = run`
        const { very: { deep: { oneToken, anotherToken } } } = require('unknown-package');

        console.log(oneToken, anotherToken);
      `;

      // Different compilers may resolve this case to one or two tokens
      imports.forEach((item) => {
        expect(item).toMatchObject({
          source: 'unknown-package',
          imported: 'very',
        });
      });
    });

    it('not an import', () => {
      const { imports } = run`
        const notModule = (() => {
          const require = () => ({});
          const { dep } = require('unknown-package');
          return result;
        })();

        console.log(notModule);
      `;

      expect(imports).toHaveLength(0);
    });

    it('not in a root scope', () => {
      const { imports } = run`
        const module = (() => {
          const { dep } = require('unknown-package');
          return result;
        })();

        console.log(module);
      `;

      expect(imports).toMatchObject([
        {
          source: 'unknown-package',
          imported: 'dep',
        },
      ]);
    });

    describe('wildcard', () => {
      it('unclear usage of the imported namespace', () => {
        const { imports } = run`
        const fullNamespace = require('unknown-package');

        console.log(fullNamespace);
      `;

        expect(imports).toMatchObject([
          {
            source: 'unknown-package',
            imported: '*',
          },
        ]);
      });

      it('clear usage of the imported namespace', () => {
        const { imports } = run`
        const fullNamespace = require('unknown-package');

        console.log(fullNamespace.foo.bar);
      `;

        expect(imports).toMatchObject([
          {
            source: 'unknown-package',
            imported: 'foo',
          },
        ]);
      });

      it('using rest operator', () => {
        const { imports } = run`
        const { ...fullNamespace } = require('unknown-package');

        console.log(fullNamespace);
      `;

        expect(imports).toMatchObject([
          {
            source: 'unknown-package',
            imported: '*',
          },
        ]);
      });

      it('using rest operator and named import', () => {
        const { imports } = run`
        const { named, ...fullNamespace } = require('unknown-package');

        console.log(fullNamespace, named);
      `;

        expect(imports).toMatchObject([
          {
            source: 'unknown-package',
            imported: '*',
          },
          {
            source: 'unknown-package',
            imported: 'named',
          },
        ]);
      });
    });
  });

  xit('dynamic imports', () => {
    // const { imports } = run`
    //   const fullNamespace = import('@linaria/shaker');
    //   const { named } = await import('@linaria/shaker');
    //   const { ...unknownRest } = await import('@linaria/unknown');
    //
    //   export { fullNamespace, named, unknownRest };
    // `;
    // const find = (source: string) => findBySource(imports, source);
    //
    // expect(imports).toHaveLength(3);
    //
    // expect(find('@linaria/shaker')).toEqual(['*', 'named']);
    // expect(find('@linaria/unknown')).toEqual(['*']);
  });

  describe('export', () => {
    it('default', () => {
      const { exports } = run`
        export default 'value';
      `;

      expect(exports).toMatchObject([
        {
          exported: 'default',
        },
      ]);
    });

    it('named', () => {
      const { exports } = run`
        const a = 1;
        export { a as named };
      `;

      expect(exports).toMatchObject([
        {
          exported: 'named',
        },
      ]);
    });

    it('with declaration', () => {
      const { exports } = run`
        export const a = 1, b = 2;
      `;

      expect(exports).toMatchObject([
        {
          exported: 'a',
        },
        {
          exported: 'b',
        },
      ]);
    });

    it('with destruction', () => {
      const { exports } = run`
        const obj = { a: 1, b: 2 };
        export const { a, b } = obj;
      `;

      expect(exports).toMatchObject([
        {
          exported: 'a',
        },
        {
          exported: 'b',
        },
      ]);
    });

    it('with destruction and rest operator', () => {
      const { exports } = run`
        const obj = { a: 1, b: 2 };
        export const { a, ...rest } = obj;
      `;

      expect(exports).toMatchObject([
        {
          exported: 'a',
        },
        {
          exported: 'rest',
        },
      ]);
    });
  });

  describe('re-export', () => {
    // `export default from …` is an experimental feature
    xit('default', () => {
      const { exports, imports, reexports } = run`
        export default from "unknown-package";
      `;

      if (reexports.length) {
        expect(reexports).toMatchObject([
          {
            imported: 'default',
            exported: 'default',
            source: 'unknown-package',
          },
        ]);
        expect(exports).toHaveLength(0);
        expect(imports).toHaveLength(0);
      } else {
        expect(reexports).toHaveLength(0);
        expect(exports).toMatchObject([
          {
            exported: 'default',
          },
        ]);
        expect(imports).toMatchObject([
          {
            source: 'unknown-package',
            imported: 'default',
          },
        ]);
      }
    });

    it('named', () => {
      const { exports, imports, reexports } = run`
        export { token } from "unknown-package";
      `;

      if (reexports.length) {
        expect(reexports).toMatchObject([
          {
            imported: 'token',
            exported: 'token',
            source: 'unknown-package',
          },
        ]);
        expect(exports).toHaveLength(0);
        expect(imports).toHaveLength(0);
      } else {
        expect(reexports).toHaveLength(0);
        expect(exports).toMatchObject([
          {
            exported: 'token',
          },
        ]);
        expect(imports).toMatchObject([
          {
            source: 'unknown-package',
            imported: 'token',
          },
        ]);
      }
    });

    it('renamed', () => {
      const { exports, imports, reexports } = run`
        export { token as renamed } from "unknown-package";
      `;

      if (reexports.length) {
        expect(reexports).toMatchObject([
          {
            imported: 'token',
            exported: 'renamed',
            source: 'unknown-package',
          },
        ]);
        expect(exports).toHaveLength(0);
        expect(imports).toHaveLength(0);
      } else {
        expect(reexports).toHaveLength(0);
        expect(exports).toMatchObject([
          {
            exported: 'renamed',
          },
        ]);
        expect(imports).toMatchObject([
          {
            source: 'unknown-package',
            imported: 'token',
          },
        ]);
      }
    });

    it('named namespace', () => {
      const { exports, imports, reexports } = run`
        export * as ns from "unknown-package";
      `;

      if (reexports.length) {
        expect(reexports).toMatchObject([
          {
            imported: '*',
            exported: 'ns',
            source: 'unknown-package',
          },
        ]);
        expect(exports).toHaveLength(0);
        expect(imports).toHaveLength(0);
      } else {
        expect(reexports).toHaveLength(0);
        expect(exports).toMatchObject([
          {
            exported: 'ns',
          },
        ]);
        expect(imports).toMatchObject([
          {
            source: 'unknown-package',
            imported: '*',
          },
        ]);
      }
    });

    it('export all', () => {
      const { exports, imports, reexports } = run`
        export * from "unknown-package";
      `;

      if (reexports.length) {
        expect(reexports).toMatchObject([
          {
            imported: '*',
            exported: '*',
            source: 'unknown-package',
          },
        ]);
        expect(exports).toHaveLength(0);
        expect(imports).toHaveLength(0);
      } else {
        expect(reexports).toHaveLength(0);
        expect(exports).toMatchObject([
          {
            exported: '*',
          },
        ]);
        expect(imports).toMatchObject([
          {
            source: 'unknown-package',
            imported: '*',
          },
        ]);
      }
    });
  });
});
