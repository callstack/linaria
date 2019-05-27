import path from 'path';
import normalize from 'normalize-path';
import fs from 'fs';
import mkdirp from 'mkdirp';
import glob from 'glob';
import yargs from 'yargs';
import transform from './transform';

const { argv } = yargs
  .usage('Usage: $0 [options] <files ...>')
  .option('config', {
    alias: 'c',
    type: 'string',
    description: 'Path to a config file',
    requiresArg: true,
  })
  .option('out-dir', {
    alias: 'o',
    type: 'string',
    description: 'Output directory for the extracted CSS files',
    demandOption: true,
    requiresArg: true,
  })
  .option('source-maps', {
    alias: 's',
    type: 'boolean',
    description: 'Generate source maps for the CSS files',
    default: false,
  })
  .option('source-root', {
    alias: 'r',
    type: 'string',
    description: 'Directory containing the source JS files',
    requiresArg: true,
  })
  .option('insert-css-requires', {
    alias: 'i',
    type: 'string',
    description:
      'Directory containing JS files to insert require statements for the CSS files',
    requiresArg: true,
  })
  .implies('insert-css-requires', 'source-root')
  .alias('help', 'h')
  .alias('version', 'v')
  .strict();

processFiles(argv._, {
  outDir: argv['out-dir'],
  sourceMaps: argv['source-maps'],
  sourceRoot: argv['source-root'],
  insertCssRequires: argv['insert-css-requires'],
  configFile: argv.config,
});

type Options = {
  outDir: string;
  sourceMaps?: boolean;
  sourceRoot?: string;
  insertCssRequires?: string;
  configFile?: string;
};

function processFiles(files: string[], options: Options) {
  let count = 0;

  const resolvedFiles = files.reduce(
    (acc, pattern) => [...acc, ...glob.sync(pattern, { absolute: true })],
    [] as string[]
  );

  resolvedFiles.forEach(filename => {
    const outputFilename = resolveOutputFilename(filename, options.outDir);

    const { cssText, sourceMap, cssSourceMapText } = transform(
      fs.readFileSync(filename).toString(),
      {
        filename,
        outputFilename,
        pluginOptions: {
          configFile: options.configFile,
        },
      }
    );

    if (cssText) {
      mkdirp.sync(path.dirname(outputFilename));

      const cssContent =
        options.sourceMaps && sourceMap
          ? `${cssText}\n/*# sourceMappingURL=${outputFilename}.map */`
          : cssText;

      fs.writeFileSync(outputFilename, cssContent);

      if (
        options.sourceMaps &&
        sourceMap &&
        typeof cssSourceMapText !== 'undefined'
      ) {
        fs.writeFileSync(`${outputFilename}.map`, cssSourceMapText);
      }

      if (options.insertCssRequires && options.sourceRoot) {
        const inputFilename = path.resolve(
          options.insertCssRequires,
          path.relative(options.sourceRoot, filename)
        );

        const relativePath = normalize(
          path.relative(path.dirname(inputFilename), outputFilename)
        );

        const requireStatement = `\nrequire('${
          relativePath.startsWith('.') ? relativePath : `./${relativePath}`
        }');`;

        const inputContent = fs.readFileSync(inputFilename, 'utf-8');

        if (!inputContent.trim().endsWith(requireStatement)) {
          fs.writeFileSync(
            inputFilename,
            `${inputContent}\n${requireStatement}\n`
          );
        }
      }

      count++;
    }
  });

  // eslint-disable-next-line no-console
  console.log(`Successfully extracted ${count} CSS files.`);
}

function resolveOutputFilename(filename: string, outDir: string) {
  const folderStructure = path.relative(process.cwd(), path.dirname(filename));
  const outputBasename = path
    .basename(filename)
    .replace(path.extname(filename), '.css');

  return path.join(outDir, folderStructure, outputBasename);
}
