// Workaround for https://github.com/import-js/eslint-plugin-import/issues/1810
const noUnresolved = ['error', { ignore: ['@linaria/*'] }];

const memberOrder = [
  'warn',
  {
    default: {
      memberTypes: [
        // Index signature
        'signature',

        // Fields
        'public-static-field',
        'protected-static-field',
        'private-static-field',

        'public-decorated-field',
        'protected-decorated-field',
        'private-decorated-field',

        'public-instance-field',
        'protected-instance-field',
        'private-instance-field',

        'public-abstract-field',
        'protected-abstract-field',
        'private-abstract-field',

        'public-field',
        'protected-field',
        'private-field',

        'static-field',
        'instance-field',
        'abstract-field',

        'decorated-field',

        'field',

        // Constructors
        'public-constructor',
        'protected-constructor',
        'private-constructor',

        'constructor',

        // Methods
        'public-static-method',
        'protected-static-method',
        'private-static-method',

        'public-decorated-method',
        'protected-decorated-method',
        'private-decorated-method',

        'public-instance-method',
        'protected-instance-method',
        'private-instance-method',

        'public-abstract-method',
        'protected-abstract-method',
        'private-abstract-method',

        'public-method',
        'protected-method',
        'private-method',

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

module.exports = {
  plugins: ['prettier', 'import'],
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
  globals: {
    JSX: 'readonly',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: [
        'airbnb-base',
        'airbnb-typescript/base',
        'plugin:@typescript-eslint/recommended',
        'prettier',
        'plugin:prettier/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript',
      ],
      parserOptions: {
        project: './tsconfig.eslint.json',
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

        // TODO
        '@typescript-eslint/ban-ts-comment': 0,
        '@typescript-eslint/comma-dangle': 0,
        '@typescript-eslint/no-non-null-assertion': 0,
        '@typescript-eslint/no-var-requires': 0,
        'global-require': 0,
        'import/no-dynamic-require': 0,
        'no-underscore-dangle': 0,
      },
    },
    {
      files: ['**/processors/**/*.ts'],
      rules: {
        '@typescript-eslint/member-ordering': memberOrder,
      },
    },
    {
      files: ['*.js', '*.jsx'],
      extends: [
        'airbnb-base',
        'plugin:prettier/recommended',
        'plugin:import/recommended',
      ],
      parser: '@babel/eslint-parser',
      parserOptions: {
        requireConfigFile: false,
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
        '@typescript-eslint/no-var-requires': 0,
        'global-require': 0,
        'no-template-curly-in-string': 0,
      },
    },
    {
      files: ['**/__dtslint__/**/*.ts'],
      rules: {
        '@typescript-eslint/ban-types': 0,
        '@typescript-eslint/no-explicit-any': 0,
        '@typescript-eslint/no-non-null-assertion': 0,
        '@typescript-eslint/no-unused-expressions': 0,
      },
    },
    {
      files: ['website/**/*.jsx'],
      extends: [
        'airbnb',
        'plugin:prettier/recommended',
        'plugin:import/recommended',
      ],
      parser: '@babel/eslint-parser',
      settings: {
        react: {
          version: 'detect',
        },
      },
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-react'],
        },
      },
      rules: {
        'global-require': 0,
      },
    },
  ],
};
