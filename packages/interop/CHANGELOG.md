# Change Log

## 6.2.0

### Minor Changes

- a3dcee2e: Update wyw-in-js to 0.5.3

## 6.1.0

### Minor Changes

- 8ba655d3: Bump wyw-in-js to 0.4.0. The full list of changes https://github.com/Anber/wyw-in-js/compare/%40wyw-in-js/transform%400.2.3...%40wyw-in-js/transform%400.4.0

## 6.0.0

### Major Changes

- 2ac94b99: BREAKING CHANGE: Linaria has been migrated to wyw-in-js.

  # Migration Guide

  ## For Users

  The main breaking change is that all tooling has been moved from the `@linaria` scope to the `@wyw-in-js` scope. This means that you will need to update your dependencies as follows:

  | Old                      | New                       |
  | ------------------------ | ------------------------- |
  | @linaria/babel-preset    | @wyw-in-js/babel-preset   |
  | @linaria/cli             | @wyw-in-js/cli            |
  | @linaria/esbuild         | @wyw-in-js/esbuild        |
  | @linaria/rollup          | @wyw-in-js/rollup         |
  | @linaria/shaker          | discontinued              |
  | @linaria/vite            | @wyw-in-js/vite           |
  | @linaria/webpack4-loader | discontinued              |
  | @linaria/webpack5-loader | @wyw-in-js/webpack-loader |

  There is no longer a need to install `@linaria/shaker` as it is now part of `@wyw-in-js/transform`, which will be installed automatically with the bundler plugins.

  The configuration file has been renamed from `linaria.config.js` (`linariarc`) to `wyw-in-js.config.js` (`.wyw-in-jsrc`).

  ## For Custom Processor Developers

  Base classes for processors and most helpers have been moved to `@wyw-in-js/processor-utils`.

  All APIs that had `linaria` in their names have been renamed:

  - The field that stores meta information in runtime has been renamed from `__linaria` to `__wyw_meta`
  - The export with all interpolated values has been renamed from `__linariaPreval` to `__wywPreval`
  - The caller name in Babel has been renamed from `linaria` to `wyw-in-js`

  For additional information, please visit the [wyw-in-js.dev](https://wyw-in-js.dev).

## 5.0.0

### Major Changes

- 88e07613: Rewritten dependecny tree processing with support for wildcard re-exports.
- cb853e14: All processing stages were merged into one generators-based processor. It allows the implementation of more complex workflows to support features like dynamic imports and re-exports.

### Minor Changes

- 9cb4143d: Refactoring of the 1st stage of transformation. It opens the road to processing wildcard reexports.

### Patch Changes

- 2a1e24a0: Upgrade TypeScript to 5.2

## 4.5.1

### Patch Changes

- e59bf809: Shaker mistakenly counts references in types as valuable and keeps referenced variables alive.

## 4.5.0

### Patch Changes

- af5bb92d: The end of support for Node.js 14. Migration to pnpm 8.

## 4.0.1

### Patch Changes

- 5edde648: Upgrade Babel to support TypeScript 4.9. Fixes #1133.

## 4.0.0

### Major Changes

- bc0cbeea: A completely new async mode with native support for Vite, Rollup, esbuild and Webpack resolvers.

  BREAKING CHANGES: Despite the fact, that it should be fully compatible with 3.0 and 2.0 branches, the new version of styles evaluator can have some serious bugs which can make your project unbuildable (however, since there is no runtime, if the build is finished successfully, everything will continue work as it was on 2.0 and 3.0). If you face some problems please let us know and we will fix it as soon as possible.

### Patch Changes

- 8be5650d: The repo has been migrated to PNPM and Turborepo
- ea41d440: New package @linaria/tags that contains all abstract logic for tags processors.

## 3.0.0-beta.20

### Patch Changes

- 8be5650d: The repo has been migrated to PNPM and Turborepo

# [3.0.0-beta.19](https://github.com/callstack/linaria/tree/master/packages/interop/compare/v3.0.0-beta.18...v3.0.0-beta.19) (2022-06-03)

### Features

- **babel:** api for custom tags ([#976](https://github.com/callstack/linaria/tree/master/packages/interop/issues/976)) ([3285ccc](https://github.com/callstack/linaria/tree/master/packages/interop/commit/3285ccc1d00449b78b3fc74087528cd38cbdd116))
- **babel:** new way for detecting tag imports ([#974](https://github.com/callstack/linaria/tree/master/packages/interop/issues/974)) ([3305cfb](https://github.com/callstack/linaria/tree/master/packages/interop/commit/3305cfb0c0f65abdacceeb7e6bad118c59f7d551))

# [3.0.0-beta.7](https://github.com/callstack/linaria/tree/master/packages/interop/compare/v3.0.0-beta.6...v3.0.0-beta.7) (2021-06-24)

**Note:** Version bump only for package @linaria/babel-plugin-interop

# [3.0.0-beta.6](https://github.com/callstack/linaria/tree/master/packages/interop/compare/v3.0.0-beta.5...v3.0.0-beta.6) (2021-06-06)

### Features

- **interop:** interop between Linaria and traditional CSS-in-JS libraries ([#776](https://github.com/callstack/linaria/tree/master/packages/interop/issues/776)) ([0a5f5b4](https://github.com/callstack/linaria/tree/master/packages/interop/commit/0a5f5b440506bfa24724d4a91e519c48d6f6c69b))
