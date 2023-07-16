import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

import * as babel from '@babel/core';

import { parseFile, prepareCode } from '@linaria/babel-preset';

const testCasesDir = join(__dirname, '__fixtures__', 'prepare-code-test-cases');

const testCaseFolders = readdirSync(testCasesDir).filter((file) =>
  statSync(join(testCasesDir, file)).isDirectory()
);

const rules = [
  {
    test: () => true,
    action: require('@linaria/shaker').default,
  },
];

const pluginOptions = {
  rules,
  babelOptions: {
    babelrc: false,
    configFile: false,
    presets: [
      ['@babel/preset-env', { loose: true }],
      '@babel/preset-react',
      '@babel/preset-typescript',
    ],
  },
};

const extensions = ['ts', 'tsx', 'js', 'jsx'];

describe('prepareCode', () => {
  testCaseFolders.forEach((testCaseFolder) => {
    test(`Testing transformation for ${testCaseFolder}`, () => {
      const root = join(testCasesDir, testCaseFolder);
      const inputFileWithoutExtension = join(root, 'input');
      const inputFilePath = extensions
        .map((ext) => `${inputFileWithoutExtension}.${ext}`)
        .find((path) => existsSync(path))!;

      const input = readFileSync(inputFilePath, 'utf8');
      const [firstLine, ...restLines] = input.split('\n');
      const only = firstLine
        .slice(2)
        .split(',')
        .map((s) => s.trim());

      const sourceCode = restLines.join('\n');
      const [ast] = parseFile(babel, inputFilePath, sourceCode, {
        root,
        pluginOptions,
      });
      if (ast === 'ignored') {
        throw new Error('Ignored');
      }

      const [transformedCode, imports, , metadata] = prepareCode(
        babel,
        inputFilePath,
        ast,
        sourceCode,
        only,
        {
          root,
          pluginOptions,
        }
      );

      expect(transformedCode).toMatchSnapshot('code');
      expect(imports).toMatchSnapshot('imports');
      expect(metadata).toMatchSnapshot('metadata');
    });
  });
});
