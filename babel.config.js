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
 * Browsers compatibility based on https://caniuse.com/css-variables
 * Versions adjusted specifically to not include any core-js polyfills
 */

const commonJSTargets = {
  browsers: [
    'Chrome > 52',
    'ChromeAndroid > 52',
    'Edge > 18',
    'Firefox > 49',
    'iOS > 10.3',
    'Opera > 39',
    'Safari > 10.1',
    'Samsung > 5',
    'last 2 versions',
    'not ie 11',
    'not ie_mob 11',
    'not op_mini all',
    'not dead',
  ],
  node: '10',
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
              node: commonJSTargets.node,
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
                  browsers: commonJSTargets.browsers,
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
       * we have to transpile JSX in tests
       */
      test: /src\/((__tests__)|(__fixtures__))\//,
      presets: ['@babel/preset-react'],
    },
  ],
};
