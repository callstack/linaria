module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: '8',
        },
      },
    ],
    '@babel/preset-typescript',
  ],
  plugins: ['@babel/plugin-proposal-class-properties'],
  overrides: [
    {
      test: /src\/(react)\//,
      presets: ['@babel/preset-react'], // We don't use JSX in react package currently, so it's for future error proof
    },
    {
      test: /src\/((react)|(core))\//, // only those modules are supposed to be run in the browser
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              browsers: [
                'last 2 versions',
                'not ie 11',
                'not ie_mob 11',
                'not op_mini all',
                'not dead',
              ],
            },
            useBuiltIns: 'usage',
            corejs: 3,
            exclude: [
              'es.array.iterator',
              'es.array.map',
              'es.array.slice',
              'es.object.assign',
              'es.object.keys',
              'transform-typeof-symbol',
              'web.dom-collections.iterator',
            ],
            loose: true,
          },
        ],
      ],
    },
  ],
};
