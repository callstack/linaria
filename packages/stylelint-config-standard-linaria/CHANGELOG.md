# Change Log

## 6.3.0

### Minor Changes

- 281ca4f5: The new version of wyw-in-js, with the support of a configurable code remover, can help prevent compilation errors and improve build time.

### Patch Changes

- Updated dependencies [281ca4f5]
  - @linaria/postcss-linaria@6.3.0

## 6.2.0

### Minor Changes

- a3dcee2e: Update wyw-in-js to 0.5.3

### Patch Changes

- Updated dependencies [a3dcee2e]
  - @linaria/postcss-linaria@6.2.0

## 6.1.0

### Minor Changes

- 8ba655d3: Bump wyw-in-js to 0.4.0. The full list of changes https://github.com/Anber/wyw-in-js/compare/%40wyw-in-js/transform%400.2.3...%40wyw-in-js/transform%400.4.0

### Patch Changes

- Updated dependencies [8ba655d3]
  - @linaria/postcss-linaria@6.1.0

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

### Patch Changes

- Updated dependencies [63392f9a]
- Updated dependencies [2ac94b99]
  - @linaria/postcss-linaria@6.0.0

## 5.0.0

### Major Changes

- 88e07613: Rewritten dependecny tree processing with support for wildcard re-exports.
- cb853e14: All processing stages were merged into one generators-based processor. It allows the implementation of more complex workflows to support features like dynamic imports and re-exports.

### Minor Changes

- 9cb4143d: Refactoring of the 1st stage of transformation. It opens the road to processing wildcard reexports.

### Patch Changes

- 2a1e24a0: Upgrade TypeScript to 5.2
- Updated dependencies [9cb4143d]
- Updated dependencies [88e07613]
- Updated dependencies [2a1e24a0]
- Updated dependencies [cb853e14]
  - @linaria/postcss-linaria@5.0.0

## 4.5.1

### Patch Changes

- Updated dependencies [e59bf809]
  - @linaria/postcss-linaria@4.5.1

## 4.5.0

### Patch Changes

- af5bb92d: The end of support for Node.js 14. Migration to pnpm 8.
- Updated dependencies [16c057df]
- Updated dependencies [af5bb92d]
  - @linaria/postcss-linaria@4.5.0

## 4.1.5

### Patch Changes

- e6420897: Update patch version so npm will pick up readme change
- Updated dependencies [5edde648]
- Updated dependencies [e6420897]
  - @linaria/postcss-linaria@4.1.5

## 4.1.4

### Patch Changes

- Updated dependencies [4c2efaa9]
  - @linaria/postcss-linaria@4.1.4

## 4.1.3

### Patch Changes

- ce36da42: Add stylelint v14 custom syntax support
- Updated dependencies [ce36da42]
  - @linaria/postcss-linaria@4.1.3
