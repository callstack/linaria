#!/usr/bin/env node
/* eslint-disable */
import process from 'node:process';
import path from 'node:path';
import chokidar from 'chokidar';
import ts from 'typescript';
// import esbuild from 'esbuild';
import fg from 'fast-glob';
import fs from 'node:fs/promises';
import swc from '@swc/core';

const [cmd, ...args] = process.argv.slice(2);

switch (cmd) {
  case 'build': {
    const outdir = path.resolve(process.cwd(), 'dist');

    await fs.rm(outdir, { recursive: true, force: true });
    const rootdir = path.resolve(process.cwd(), './src');

    let files = await fg(['src/**/*.{ts,tsx}'], {
      absolute: true,
      cwd: process.cwd(),
      ignore: ['**/*.d.ts', 'dist'],
    });

    let watcher;

    const build = async () => {
      const at = performance.now();
      // esbuild
      // const common = {
      //   platform: 'node',
      //   target: 'node12',
      //   loader: 'ts',
      // };
      // const variants = [
      //   { format: 'esm', ext: '.js' },
      //   { format: 'cjs', ext: '.js' },
      // ];

      const variants = [
        { format: 'nodenext', ext: '.js', dir: 'esm' },
        { format: 'commonjs', ext: '.js', dir: 'cjs' },
      ];
      // swc file-by-file
      for (const file of files) {
        const inp = path.parse(file);
        for (const { ext, format, dir } of variants) {
          /**@type {swc.Output}*/ let result;
          try {
            result = await swc.transformFile(file, {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  dynamicImport: true,
                },
                target: 'es2022',
                loose: true,
              },
              module: {
                type: format,
              },
              sourceMaps: true,
              configFile: false,
              swcrc: false,
              cwd: process.cwd(),
              filename: inp.base,
              // env: {
              //   coreJs: args.includes('--legacy') ? '3.22' : undefined,
              // },
            });
          } catch (e) {
            console.error(e);
            continue;
          }
          const dist = path.resolve(outdir, dir);
          const outfiledir = inp.dir.replace(rootdir, dist);
          const out = path.format({
            root: inp.root,
            name: inp.name,
            ext,
            dir: outfiledir,
          });
          result.code += `\n //# sourceMappingURL=${inp.name}.js.map`;
          await fs.mkdir(outfiledir, { recursive: true });
          await fs.writeFile(out, result.code);
          await fs.writeFile(out + '.map', result.map);
        }
      }
      // for (const { ext, format } of variants) {
      // by build
      // await esbuild.build({
      //   absWorkingDir: process.cwd(),
      //   entryPoints: files,
      //   platform: 'node',
      //   loader: {
      //     '.ts': 'ts',
      //   },
      //   sourcemap: 'linked',
      //   format,
      //   treeShaking: true,
      //   bundle: args.includes('--bundle'),
      //   // external: [],
      //   outdir: path.resolve(outdir, format),
      //   outExtension: { '.js': ext },
      // });
      // }
      // file-by-file
      // for (const file of files) {
      //   // const content = await fs.readFile(file, "utf8");
      //   const inp = path.parse(file);

      //   for (const { ext, format } of variants) {
      //     const dist = path.resolve(outdir, format);
      //     /**@type {esbuild.TransformResult}*/ let result;
      //     try {
      //       // result = await esbuild.transform(content, {
      //       //   ...common,
      //       //   format,
      //       // });
      //     } catch (e) {
      //       /**@type {esbuild.TransformFailure}*/ const err = e;
      //       console.error(err.message);
      //       continue;
      //     }

      //     const outfiledir = inp.dir.replace(rootdir, dist);
      //     const out = path.format({
      //       root: inp.root,
      //       name: inp.name,
      //       ext,
      //       dir: outfiledir,
      //     });
      //     await fs.mkdir(outfiledir, { recursive: true });
      //     await fs.writeFile(out, result.code);
      //   }
      // }

      const tsConfig = ts.parseJsonConfigFileContent(
        ts.readConfigFile(
          path.resolve(process.cwd(), './tsconfig.json'),
          ts.sys.readFile
        ).config,
        ts.sys,
        './'
      );

      const tsHost = ts.createCompilerHost(tsConfig);
      const tsProgram = ts.createProgram(
        files,
        {
          outDir: path.resolve(outdir, './types'),
          declaration: true,
          emitDeclarationOnly: true,
          skipDefaultLibCheck: true,
          skipLibCheck: true,
          incremental: true,
          ...tsConfig.options,
        },
        tsHost
      );
      const { diagnostics } = tsProgram.emit();
      for (const d of diagnostics) {
        console.info(d.messageText);
      }

      const duraton = ((performance.now() - at) / 1000).toFixed(1);
      console.log('Done.', duraton, 's.');
    };

    const exit = async () => {
      await watcher?.close();
      process.exit();
    };

    process.on('SIGINT', exit);
    if (process.platform === 'win32') process.on('SIGKILL', exit);

    if (!args.includes('--watch')) {
      await build();
      process.exit();
    }
    watcher = chokidar
      .watch(path.resolve(process.cwd(), rootdir), {
        ignoreInitial: false,
        awaitWriteFinish: {
          stabilityThreshold: 50,
          pollInterval: 10,
        },
      })
      .on('ready', () => console.info('Watching for directory changes.'))
      .on('all', build);

    break;
  }
  default: {
    throw new Error(`Unsupported command ${cmd}`);
  }
}
