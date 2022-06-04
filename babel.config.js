/*
 * The following environments are supported:
 *
 * (unspecified): Produces ES module output, no language features
 *   (except non-standard ones) are transpiled.
 * "legacy": Produces CommonJS output, uses @babel/preset-env to target
 *   Node.js 12 and specific browsers.
 * "test": Used by Jest, produces CommonJS output, targetting
 *   the same version as legacy.
 */

/*
 * Configuration for the legacy build
 */

const commonJSTargets = {
  browsers: '> 0.25% and supports array-includes',
  // browsers: 'chrome > 90',
  node: '12',
};

module.exports = {
  presets: ['@babel/preset-typescript'],
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
              node: commonJSTargets.node,
            },
          },
        ],
        '@babel/preset-typescript',
      ],
    },
  },
  overrides: [
    {
      /**
       * only react and core packages are targeted to be run in the browser
       */
      test: /\/packages\/(?:atomic|core|react)\/(?!src\/processors\/)/,
      presets: ['@babel/preset-react'],
      env: {
        legacy: {
          presets: [
            [
              '@babel/preset-env',
              {
                targets: commonJSTargets.browsers,
                loose: true,
                // our styled component should not need to use any polyfill. We do not include core-js in dependencies. However, we leave this to detect if future changes would not introduce any need for polyfill
                useBuiltIns: 'usage',
                // Even core-js doesn't remember IE11
                exclude: ['es.array.includes', 'web.dom-collections.iterator'],
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
      test: /\/(__tests__|__fixtures__|packages\/teskit\/src)\//,
      presets: ['@babel/preset-react'],
    },
  ],
};
