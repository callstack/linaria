/*
 * The following environments are supported:
 *
 * (unspecified): Produces ES module output, no language features
 *   (except non-standard ones) are transpiled.
 * "legacy": Produces CommonJS output, uses @babel/preset-env to target
 *   Node.js 10 and specific browsers.
 * "test": Used by Jest, produces CommonJS output, targetting
 *   the current Node.js version.
 */

/*
 * Configuration for the legacy build
 */
const legacy = {
  targets: {
    node: '10',
    browsers: [
      'last 2 versions',
      'not ie 11',
      'not ie_mob 11',
      'not op_mini all',
      'not dead',
    ],
  },
};

module.exports = {
  presets: ['@babel/preset-typescript'],
  plugins: ['@babel/plugin-proposal-class-properties'],
  env: {
    legacy: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: legacy.targets.node,
            },
          },
        ],
      ],
    },
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: '10',
            },
          },
        ],
      ],
    },
  },
  overrides: [
    {
      /**
       * only src/react and src/core are targeted to be run in the browser
       */
      test: /src\/((react)|(core))\//,
      presets: ['@babel/preset-react'],
      env: {
        legacy: {
          presets: [
            [
              '@babel/preset-env',
              {
                targets: {
                  browsers: legacy.targets.browsers,
                },
                loose: true,
                // our styled component should not need to use any polyfill. We do not include core-js in dependencies. However, we leave this to detect if future changes would not introduce any need for polyfill
                useBuiltIns: 'usage',
                corejs: 3,
                // this is used to test if we do not introduced core-js polyfill
                debug: process.env.DEBUG_CORE_JS === 'true',
              },
            ],
          ],
        },
      },
    },
    {
      /**
       * we use the same config for src/__tests__ and src/__fixtures__ to not break existing tests
       */
      test: /src\/((__tests__)|(__fixtures__))\//,
      presets: [
        '@babel/preset-react',
        [
          '@babel/preset-env',
          {
            targets: {
              browsers: legacy.targets.browsers,
            },
          },
        ],
      ],
    },
  ],
};
