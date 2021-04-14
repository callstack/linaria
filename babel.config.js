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

const commonJSTargets = {
  browsers: ['last 2 versions', 'not op_mini all', 'not dead'],
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
       * only react and core packages are targeted to be run in the browser
       */
      test: /\/packages\/((react)|(core))\//,
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
                // Even core-js doesn't remember IE11
                exclude: [
                  /es\.array\.(?:filter|for-each|index-of|join|reduce|slice)/,
                  'es.function.name',
                  'es.object.keys',
                  'web.dom-collections.for-each',
                ],
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
      test: /\/((__tests__)|(__fixtures__))\//,
      presets: ['@babel/preset-react'],
    },
  ],
};
