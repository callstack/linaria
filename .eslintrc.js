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
