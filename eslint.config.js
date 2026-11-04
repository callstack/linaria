const { fixupPluginRules } = require('@eslint/compat');
const { FlatCompat } = require('@eslint/eslintrc');
const airbnbBestPractices = require('eslint-config-airbnb-base/rules/best-practices');
const airbnbES6 = require('eslint-config-airbnb-base/rules/es6');
const airbnbImports = require('eslint-config-airbnb-base/rules/imports');
const airbnbStyle = require('eslint-config-airbnb-base/rules/style');
const airbnbVariables = require('eslint-config-airbnb-base/rules/variables');
const prettierRecommended = require('eslint-plugin-prettier/recommended');
const importPlugin = require('eslint-plugin-import');
const prettierPlugin = require('eslint-plugin-prettier');
const tseslint = require('typescript-eslint');

// Loads the airbnb shareable configs, which are published in the eslintrc format only.
const compat = new FlatCompat({ baseDirectory: __dirname });

// Applies a list of flat configs to the given files only, like `extends` inside an eslintrc override.
const forFiles = (files, configs) =>
  configs.flat(Infinity).map((config) => ({
    ...config,
    files: config.files
      ? files.flatMap((outer) => config.files.map((inner) => [outer, inner]))
      : files,
  }));

const noRestrictedSyntax = airbnbStyle.rules['no-restricted-syntax'].filter(
  (rule) => typeof rule === 'string' || rule.selector !== 'ForOfStatement'
);

// ESLint 9 and typescript-eslint 8 report unused `catch` bindings by default; ESLint 8 did not
const noUnusedVars = [
  airbnbVariables.rules['no-unused-vars'][0],
  { ...airbnbVariables.rules['no-unused-vars'][1], caughtErrors: 'none' },
];

// Workaround for https://github.com/import-js/eslint-plugin-import/issues/1810
const noUnresolved = ['error', { ignore: ['@linaria/*'] }];

const memberOrder = [
  'warn',
  {
    default: {
      memberTypes: [
        // Index signature
        'signature',
        'call-signature',

        // Fields
        'public-static-field',
        'protected-static-field',
        'private-static-field',
        '#private-static-field',

        'public-decorated-field',
        'protected-decorated-field',
        'private-decorated-field',

        'public-instance-field',
        'protected-instance-field',
        'private-instance-field',
        '#private-instance-field',

        'public-abstract-field',
        'protected-abstract-field',

        'public-field',
        'protected-field',
        'private-field',
        '#private-field',

        'static-field',
        'instance-field',
        'abstract-field',

        'decorated-field',

        'field',

        // Static initialization
        'static-initialization',

        // Constructors
        'public-constructor',
        'protected-constructor',
        'private-constructor',

        'constructor',

        // Getters & Setters
        ['public-static-get', 'public-static-set'],
        ['protected-static-get', 'protected-static-set'],
        ['private-static-get', 'private-static-set'],
        ['#private-static-get', '#private-static-set'],

        ['public-decorated-get', 'public-decorated-set'],
        ['protected-decorated-get', 'protected-decorated-set'],
        ['private-decorated-get', 'private-decorated-set'],

        ['public-instance-get', 'public-instance-set'],
        ['protected-instance-get', 'protected-instance-set'],
        ['private-instance-get', 'private-instance-set'],
        ['#private-instance-get', '#private-instance-set'],

        ['public-abstract-get', 'public-abstract-set'],
        ['protected-abstract-get', 'protected-abstract-set'],

        ['public-get', 'public-set'],
        ['protected-get', 'protected-set'],
        ['private-get', 'private-set'],
        ['#private-get', '#private-set'],

        ['static-get', 'static-set'],
        ['instance-get', 'instance-set'],
        ['abstract-get', 'abstract-set'],

        ['decorated-get', 'decorated-set'],

        ['get', 'set'],

        // Methods
        'public-static-method',
        'protected-static-method',
        'private-static-method',
        '#private-static-method',

        'public-decorated-method',
        'protected-decorated-method',
        'private-decorated-method',

        'public-instance-method',
        'protected-instance-method',
        'private-instance-method',
        '#private-instance-method',

        'public-abstract-method',
        'protected-abstract-method',

        'public-method',
        'protected-method',
        'private-method',
        '#private-method',

        'static-method',
        'instance-method',
        'abstract-method',

        'decorated-method',

        'method',
      ],
      order: 'alphabetically',
    },
  },
];

const importOrder = [
  'warn',
  {
    'newlines-between': 'always',
    alphabetize: {
      order: 'asc',
    },
    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
    pathGroups: [
      {
        pattern: '@linaria/**',
        group: 'internal',
        position: 'before',
      },
    ],
    pathGroupsExcludedImportTypes: [],
  },
];

// The TypeScript part of the former eslint-config-airbnb-typescript/base, written against
// typescript-eslint 8. Its formatting rules are gone from typescript-eslint 8 and are turned off
// by eslint-config-prettier anyway, so they are not listed. The only one of them that prettier
// does not turn off, `@typescript-eslint/lines-between-class-members`, is gone as well: the core
// `lines-between-class-members` rule from airbnb-base takes its place.
const airbnbTypescript = {
  plugins: { '@typescript-eslint': tseslint.plugin },
  languageOptions: { parser: tseslint.parser },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx', '.d.ts'],
    },
    'import/resolver': {
      node: {
        extensions: ['.mjs', '.js', '.json', '.ts', '.d.ts'],
      },
    },
    'import/extensions': ['.js', '.mjs', '.jsx', '.ts', '.tsx', '.d.ts'],
    'import/external-module-folders': ['node_modules', 'node_modules/@types'],
  },
  rules: {
    camelcase: 'off',
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'variable',
        format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
      },
      {
        selector: 'function',
        format: ['camelCase', 'PascalCase'],
      },
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
    ],
    'default-param-last': 'off',
    '@typescript-eslint/default-param-last':
      airbnbBestPractices.rules['default-param-last'],
    'dot-notation': 'off',
    '@typescript-eslint/dot-notation':
      airbnbBestPractices.rules['dot-notation'],
    'no-array-constructor': 'off',
    '@typescript-eslint/no-array-constructor':
      airbnbStyle.rules['no-array-constructor'],
    'no-dupe-class-members': 'off',
    '@typescript-eslint/no-dupe-class-members':
      airbnbES6.rules['no-dupe-class-members'],
    'no-empty-function': 'off',
    '@typescript-eslint/no-empty-function':
      airbnbBestPractices.rules['no-empty-function'],
    'no-implied-eval': 'off',
    'no-new-func': 'off',
    '@typescript-eslint/no-implied-eval':
      airbnbBestPractices.rules['no-implied-eval'],
    'no-magic-numbers': 'off',
    '@typescript-eslint/no-magic-numbers':
      airbnbBestPractices.rules['no-magic-numbers'],
    'no-redeclare': 'off',
    '@typescript-eslint/no-redeclare':
      airbnbBestPractices.rules['no-redeclare'],
    'no-shadow': 'off',
    // typescript-eslint 8 changed the default `hoist` from 'functions' to 'functions-and-types'
    '@typescript-eslint/no-shadow': [
      airbnbVariables.rules['no-shadow'],
      { hoist: 'functions' },
    ],
    // typescript-eslint 8 replaced `no-throw-literal` with `only-throw-error`
    'no-throw-literal': 'off',
    '@typescript-eslint/only-throw-error':
      airbnbBestPractices.rules['no-throw-literal'],
    'no-unused-expressions': 'off',
    '@typescript-eslint/no-unused-expressions':
      airbnbBestPractices.rules['no-unused-expressions'],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': noUnusedVars,
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define':
      airbnbVariables.rules['no-use-before-define'],
    'no-useless-constructor': 'off',
    '@typescript-eslint/no-useless-constructor':
      airbnbES6.rules['no-useless-constructor'],
    'require-await': 'off',
    '@typescript-eslint/require-await':
      airbnbBestPractices.rules['require-await'],
    'no-return-await': 'off',
    '@typescript-eslint/return-await': [
      airbnbBestPractices.rules['no-return-await'],
      'in-try-catch',
    ],
    'import/extensions': [
      airbnbImports.rules['import/extensions'][0],
      airbnbImports.rules['import/extensions'][1],
      {
        ...airbnbImports.rules['import/extensions'][2],
        ts: 'never',
        tsx: 'never',
      },
    ],
    'import/no-extraneous-dependencies': [
      airbnbImports.rules['import/no-extraneous-dependencies'][0],
      {
        ...airbnbImports.rules['import/no-extraneous-dependencies'][1],
        devDependencies: airbnbImports.rules[
          'import/no-extraneous-dependencies'
        ][1].devDependencies.flatMap((pattern) => {
          const withTs = pattern.replace(/\bjs(x?)\b/g, 'ts$1');
          return withTs === pattern ? [pattern] : [pattern, withTs];
        }),
      },
    ],

    // Checked by the TypeScript compiler
    'constructor-super': 'off',
    'getter-return': 'off',
    'no-const-assign': 'off',
    'no-dupe-args': 'off',
    'no-dupe-keys': 'off',
    'no-func-assign': 'off',
    'no-import-assign': 'off',
    'no-new-symbol': 'off',
    'no-obj-calls': 'off',
    'no-setter-return': 'off',
    'no-this-before-super': 'off',
    'no-undef': 'off',
    'no-unreachable': 'off',
    'no-unsafe-negation': 'off',
    'valid-typeof': 'off',
    'import/named': 'off',
    'import/no-named-as-default-member': 'off',
    'import/no-unresolved': 'off',
  },
};

const configs = [
  {
    ignores: [
      '**/__fixtures__/',
      '**/coverage/',
      '**/lib/',
      '**/esm/',
      'packages/*/bin/',
      'packages/*/types/',
      '**/dist/',
      '**/build/',
      '**/vendor/',
      '**/examples/',
      // ESLint 8 skipped these by default
      '**/.*',
      '**/*.cjs',
      '**/*.mjs',
    ],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
    plugins: { prettier: prettierPlugin, import: importPlugin },
    rules: {
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            '**/*.test.{js,ts,jsx,tsx}',
            'src/{babel,server}/**/*.{js,ts,jsx,tsx}',
          ],
        },
      ],
      'import/no-unresolved': noUnresolved,
      'max-len': [
        'error',
        150,
        2,
        {
          ignoreComments: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreUrls: true,
        },
      ],
      'prettier/prettier': 'error',
    },
    languageOptions: {
      globals: {
        JSX: 'readonly',
      },
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
  },
  ...forFiles(
    ['**/*.ts', '**/*.tsx'],
    [
      compat.extends('airbnb-base'),
      airbnbTypescript,
      tseslint.configs.recommended,
      prettierRecommended,
      compat.extends('plugin:import/recommended', 'plugin:import/typescript'),
      {
        languageOptions: {
          parserOptions: {
            // The `node` environment of airbnb-base turns this on. With it typescript-eslint 8 puts
            // the declarations of a module into a nested scope that `no-redeclare` does not check.
            ecmaFeatures: { globalReturn: false },
            project: './tsconfig.eslint.json',
          },
        },
        rules: {
          'import/extensions': 0,
          'import/no-unresolved': noUnresolved,
          'import/order': importOrder,
          'import/prefer-default-export': 0,
          'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
          '@typescript-eslint/consistent-type-imports': [
            'error',
            { prefer: 'type-imports' },
          ],
          '@typescript-eslint/member-ordering': memberOrder,
          // Successor of `ban-types` for `{}`; empty interfaces were not reported before
          '@typescript-eslint/no-empty-object-type': [
            'error',
            { allowInterfaces: 'always' },
          ],

          // TODO
          '@typescript-eslint/ban-ts-comment': 0,
          '@typescript-eslint/no-non-null-assertion': 0,
          '@typescript-eslint/no-require-imports': 0,
          'global-require': 0,
          'import/no-dynamic-require': 0,
          'no-underscore-dangle': 0,
          'no-restricted-syntax': noRestrictedSyntax,
        },
      },
    ]
  ),
  ...forFiles(
    ['**/*.js', '**/*.jsx'],
    [
      compat.extends('airbnb-base'),
      prettierRecommended,
      compat.extends('plugin:import/recommended'),
      {
        languageOptions: {
          ecmaVersion: 'latest',
        },
        rules: {
          'import/no-unresolved': noUnresolved,
          'no-unused-vars': noUnusedVars,
        },
      },
    ]
  ),
  {
    files: ['**/*.jsx'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
  {
    files: ['eslint.config.js'],
    rules: {
      'import/no-extraneous-dependencies': [
        airbnbImports.rules['import/no-extraneous-dependencies'][0],
        {
          ...airbnbImports.rules['import/no-extraneous-dependencies'][1],
          devDependencies: [
            ...airbnbImports.rules['import/no-extraneous-dependencies'][1]
              .devDependencies,
            '**/eslint.config.js',
          ],
        },
      ],
    },
  },
  {
    files: [
      'packages/testkit/**/*.test.ts',
      '**/__tests__/**/*.test.ts',
      '**/__tests__/**/*.test.tsx',
      '**/__utils__/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
        },
        {
          selector: 'function',
          leadingUnderscore: 'allow',
          format: ['camelCase', 'PascalCase'],
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
      ],
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/no-non-null-assertion': 0,
      '@typescript-eslint/no-require-imports': 0,
      'global-require': 0,
      'no-template-curly-in-string': 0,
    },
  },
  {
    files: ['**/__dtslint__/**/*.ts'],
    rules: {
      // typescript-eslint 8 split `ban-types` into these three rules
      '@typescript-eslint/no-empty-object-type': 0,
      '@typescript-eslint/no-unsafe-function-type': 0,
      '@typescript-eslint/no-wrapper-object-types': 0,
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/no-non-null-assertion': 0,
      '@typescript-eslint/no-unused-expressions': 0,
    },
  },
  ...forFiles(
    ['website/**/*.jsx'],
    [
      compat.extends('airbnb'),
      prettierRecommended,
      compat.extends('plugin:import/recommended'),
      {
        settings: {
          react: {
            version: 'detect',
          },
        },
        languageOptions: {
          ecmaVersion: 'latest',
        },
        rules: {
          'import/no-unresolved': noUnresolved,
          'global-require': 0,
          'no-unused-vars': noUnusedVars,
        },
      },
    ]
  ),
  {
    files: ['website/**'],
    settings: {
      'import/core-modules': [],
    },
  },
  ...forFiles(['website/src/**'], [compat.env({ browser: true })]),
];

// eslint-plugin-import 2 and eslint-plugin-react 7 still call context and source code methods
// that ESLint 10 removed; wrap them with the compatibility layer of @eslint/compat.
const fixupPlugins = (config) => {
  if (!config.plugins || !(config.plugins.import || config.plugins.react)) {
    return config;
  }

  const plugins = { ...config.plugins };
  ['import', 'react'].forEach((name) => {
    if (plugins[name]) {
      plugins[name] = fixupPluginRules(plugins[name]);
    }
  });

  return { ...config, plugins };
};

module.exports = configs.map(fixupPlugins);
