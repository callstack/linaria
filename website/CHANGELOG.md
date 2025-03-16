# Change Log

## 6.3.0

### Minor Changes

- 281ca4f5: The new version of wyw-in-js, with the support of a configurable code remover, can help prevent compilation errors and improve build time.

### Patch Changes

- Updated dependencies [bd8d45fd]
- Updated dependencies [281ca4f5]
  - @linaria/react@6.3.0
  - @linaria/atomic@6.3.0
  - @linaria/core@6.3.0
  - @linaria/server@6.3.0

## 6.2.0

### Minor Changes

- a3dcee2e: Update wyw-in-js to 0.5.3

### Patch Changes

- Updated dependencies [a3dcee2e]
  - @linaria/atomic@6.2.0
  - @linaria/core@6.2.0
  - @linaria/server@6.2.0
  - @linaria/react@6.2.1

## 6.1.1

### Patch Changes

- Updated dependencies [fd60b5de]
  - @linaria/react@6.2.0
  - @linaria/atomic@6.1.1

## 6.1.0

### Minor Changes

- 8ba655d3: Bump wyw-in-js to 0.4.0. The full list of changes https://github.com/Anber/wyw-in-js/compare/%40wyw-in-js/transform%400.2.3...%40wyw-in-js/transform%400.4.0

### Patch Changes

- 8d4ebd33: chore: bump @wyw-in-js/\* packages
- Updated dependencies [8d4ebd33]
- Updated dependencies [8ba655d3]
  - @linaria/atomic@6.1.0
  - @linaria/core@6.1.0
  - @linaria/react@6.1.0
  - @linaria/server@6.1.0

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

- Updated dependencies [60e6b7e2]
- Updated dependencies [2ac94b99]
  - @linaria/atomic@6.0.0
  - @linaria/core@6.0.0
  - @linaria/react@6.0.0
  - @linaria/server@6.0.0

## 5.0.3

### Patch Changes

- Updated dependencies [4b083b7c]
  - @linaria/react@5.0.3
  - @linaria/atomic@5.0.3

## 5.0.2

### Patch Changes

- Updated dependencies [1e889937]
  - @linaria/react@5.0.2
  - @linaria/atomic@5.0.2
  - @linaria/core@5.0.2

## 5.0.1

### Patch Changes

- @linaria/atomic@5.0.1
- @linaria/core@5.0.1
- @linaria/react@5.0.1

## 5.0.0

### Major Changes

- 88e07613: Rewritten dependecny tree processing with support for wildcard re-exports.
- cb853e14: All processing stages were merged into one generators-based processor. It allows the implementation of more complex workflows to support features like dynamic imports and re-exports.

### Patch Changes

- 2a1e24a0: Upgrade TypeScript to 5.2
- Updated dependencies [9cb4143d]
- Updated dependencies [88e07613]
- Updated dependencies [2a1e24a0]
- Updated dependencies [cb853e14]
  - @linaria/atomic@5.0.0
  - @linaria/core@5.0.0
  - @linaria/react@5.0.0
  - @linaria/server@5.0.0

## 4.5.4

### Patch Changes

- @linaria/atomic@4.5.4
- @linaria/core@4.5.4
- @linaria/react@4.5.4

## 4.5.3

### Patch Changes

- e59bf809: Shaker mistakenly counts references in types as valuable and keeps referenced variables alive.
- 520ba8da: Debug mode for CLI, Webpack 5 and Vite. When enabled, prints brief perf report to console and information about processed dependency tree to the specified file.
- Updated dependencies [79557248]
- Updated dependencies [e59bf809]
  - @linaria/atomic@4.5.3
  - @linaria/core@4.5.3
  - @linaria/react@4.5.3

## 4.5.2

### Patch Changes

- 1bf5c5b8: The cache has been improved, which should address the build time issues for Webpack 4/5 and resolve HMR-related problems for Vite. Fixes #1199, #1265 and maybe some more.
  - @linaria/atomic@4.5.2
  - @linaria/core@4.5.2
  - @linaria/react@4.5.2

## 4.5.1

### Patch Changes

- Updated dependencies [ceca1611]
- Updated dependencies [13258306]
  - @linaria/react@4.5.1
  - @linaria/atomic@4.5.1
  - @linaria/core@4.5.1

## 4.5.0

### Minor Changes

- 16c057df: Breaking Change: Performance Optimization for `styled`

  When a component is wrapped in `styled`, Linaria needs to determine if that component is already a styled component. To accomplish this, the wrapped component is included in the list of variables for evaluation, along with the interpolated values used in styles. The issue arises when a wrapped component, even if it is not styled, brings along a substantial dependency tree. This situation is particularly evident when using `styled` to style components from third-party UI libraries.

  To address this problem, Linaria will now examine the import location of the component and check if there is an annotation in the `package.json` file of the package containing the components. This annotation indicates whether the package includes other Linaria components. If there is no such annotation, Linaria will refrain from evaluating the component.

  Please note that this Breaking Change solely affects developers of component libraries. In order for users to style components from your library, you must include the `linaria.components` property in the library's `package.json` file. This property should have a mask that covers all imported files with components. Here's an example of how to specify it:

  ```json
  "linaria": {
    "components": "**/*"
  }
  ```

### Patch Changes

- af5bb92d: The end of support for Node.js 14. Migration to pnpm 8.
- Updated dependencies [16c057df]
- Updated dependencies [af5bb92d]
- Updated dependencies [10859924]
  - @linaria/react@4.5.0
  - @linaria/atomic@4.5.0
  - @linaria/core@4.5.0
  - @linaria/server@4.5.0

## 4.1.16

### Patch Changes

- Updated dependencies [54ab61b2]
  - @linaria/react@4.3.8
  - @linaria/atomic@4.2.10
  - @linaria/core@4.2.10

## 4.1.15

### Patch Changes

- Updated dependencies [1c3f309d]
- Updated dependencies [34029088]
  - @linaria/react@4.3.7
  - @linaria/atomic@4.2.9
  - @linaria/core@4.2.9

## 4.1.14

### Patch Changes

- Updated dependencies [a3ad617f]
  - @linaria/react@4.3.6
  - @linaria/atomic@4.2.8
  - @linaria/core@4.2.8

## 4.1.13

### Patch Changes

- Updated dependencies [a2b618bc]
  - @linaria/atomic@4.2.7
  - @linaria/core@4.2.7
  - @linaria/react@4.3.5

## 4.1.12

### Patch Changes

- @linaria/atomic@4.2.6
- @linaria/core@4.2.6
- @linaria/react@4.3.4

## 4.1.11

### Patch Changes

- Updated dependencies [61fe2560]
- Updated dependencies [77bcf2e7]
  - @linaria/atomic@4.2.5
  - @linaria/server@4.1.0
  - @linaria/core@4.2.5
  - @linaria/react@4.3.3

## 4.1.10

### Patch Changes

- @linaria/atomic@4.2.4
- @linaria/core@4.2.4
- @linaria/react@4.3.2

## 4.1.9

### Patch Changes

- 6b8bff49: Switch website to pnpm
- 5edde648: Upgrade Babel to support TypeScript 4.9. Fixes #1133.
- Updated dependencies [922f20d6]
- Updated dependencies [5edde648]
  - @linaria/react@4.3.1
  - @linaria/atomic@4.2.3
  - @linaria/core@4.2.3

## 4.1.8

### Patch Changes

- Updated dependencies [63f56d47]
- Updated dependencies [c26d4667]
  - @linaria/react@4.3.0
  - @linaria/atomic@4.2.2
  - @linaria/core@4.2.2

## 4.1.7

### Patch Changes

- Updated dependencies [6de22792]
  - @linaria/react@4.2.1
  - @linaria/atomic@4.2.1
  - @linaria/core@4.2.1

## 4.1.6

### Patch Changes

- Updated dependencies [1e88e95d]
  - @linaria/atomic@4.2.0
  - @linaria/core@4.2.0
  - @linaria/react@4.2.0

## 4.1.5

### Patch Changes

- Updated dependencies [87ffe61c]
  - @linaria/atomic@4.1.5
  - @linaria/core@4.1.4
  - @linaria/react@4.1.5

## 4.1.4

### Patch Changes

- @linaria/atomic@4.1.4
- @linaria/core@4.1.3
- @linaria/react@4.1.4

## 4.1.3

### Patch Changes

- Updated dependencies [c0bd271a]
  - @linaria/react@4.1.3
  - @linaria/atomic@4.1.3
  - @linaria/core@4.1.2

## 4.1.2

### Patch Changes

- @linaria/atomic@4.1.2
- @linaria/core@4.1.1
- @linaria/react@4.1.2

## 4.1.1

### Patch Changes

- Updated dependencies [2abc55b3]
  - @linaria/react@4.1.1
  - @linaria/atomic@4.1.1

## 4.1.0

### Patch Changes

- @linaria/atomic@4.1.0
- @linaria/core@4.1.0
- @linaria/react@4.1.0

## 4.0.0

### Major Changes

- bc0cbeea: A completely new async mode with native support for Vite, Rollup, esbuild and Webpack resolvers.

  BREAKING CHANGES: Despite the fact, that it should be fully compatible with 3.0 and 2.0 branches, the new version of styles evaluator can have some serious bugs which can make your project unbuildable (however, since there is no runtime, if the build is finished successfully, everything will continue work as it was on 2.0 and 3.0). If you face some problems please let us know and we will fix it as soon as possible.

### Patch Changes

- 8be5650d: The repo has been migrated to PNPM and Turborepo
- ea41d440: New package @linaria/tags that contains all abstract logic for tags processors.
- Updated dependencies [f0cddda4]
  - @linaria/atomic@4.0.0
  - @linaria/core@4.0.0
  - @linaria/react@4.0.0
  - @linaria/server@4.0.0

## 3.0.0-beta.21

### Patch Changes

- Updated dependencies [17c83e34]
  - @linaria/react@3.0.0-beta.21
  - @linaria/core@3.0.0-beta.21
  - @linaria/atomic@3.0.0-beta.21

## 3.0.0-beta.20

### Patch Changes

- 8be5650d: The repo has been migrated to PNPM and Turborepo
- Updated dependencies
  - @linaria/atomic@3.0.0-beta.20
  - @linaria/core@3.0.0-beta.20
  - @linaria/react@3.0.0-beta.20
  - @linaria/server@3.0.0-beta.20

# [3.0.0-beta.19](https://github.com/callstack/linaria/compare/v3.0.0-beta.18...v3.0.0-beta.19) (2022-06-03)

### Features

- **atomic:** add support for atomic using styled API ([#966](https://github.com/callstack/linaria/issues/966)) ([f59860b](https://github.com/callstack/linaria/commit/f59860b09c5f91b0423dbf188e5f8aaaef38a6b5))
- **babel:** api for custom tags ([#976](https://github.com/callstack/linaria/issues/976)) ([3285ccc](https://github.com/callstack/linaria/commit/3285ccc1d00449b78b3fc74087528cd38cbdd116))
- **babel:** new way for detecting tag imports ([#974](https://github.com/callstack/linaria/issues/974)) ([3305cfb](https://github.com/callstack/linaria/commit/3305cfb0c0f65abdacceeb7e6bad118c59f7d551))
- **core:** allow renaming of css template literals ([#973](https://github.com/callstack/linaria/issues/973)) ([8f59a82](https://github.com/callstack/linaria/commit/8f59a82400143ef35b6ffc7f024ad5e6a16552d8))

# [3.0.0-beta.18](https://github.com/callstack/linaria/compare/v3.0.0-beta.17...v3.0.0-beta.18) (2022-04-01)

### Features

- **atomic:** add support for at-rules, keyframes and pseudo classes ([#913](https://github.com/callstack/linaria/issues/913)) ([dee7fa1](https://github.com/callstack/linaria/commit/dee7fa14ea912224cac9f0673be7464e93571a73))

# [3.0.0-beta.17](https://github.com/callstack/linaria/compare/v3.0.0-beta.16...v3.0.0-beta.17) (2021-12-27)

### Features

- **resolver:** add custom resolver option to support re-exporting of linaria libs ([#882](https://github.com/callstack/linaria/issues/882)) ([ad4a368](https://github.com/callstack/linaria/commit/ad4a36857faceec19fa083b28d43af01d5f48f11))

# [3.0.0-beta.16](https://github.com/callstack/linaria/compare/v3.0.0-beta.15...v3.0.0-beta.16) (2021-12-01)

**Note:** Version bump only for package linaria-website

# [3.0.0-beta.15](https://github.com/callstack/linaria/compare/v3.0.0-beta.14...v3.0.0-beta.15) (2021-11-29)

### Features

- **atomic:** create an atomic package for the css API ([#867](https://github.com/callstack/linaria/issues/867)) ([4773bcf](https://github.com/callstack/linaria/commit/4773bcf4b14f08cdc4d2b612654b962cdfc97eaa))

# [3.0.0-beta.14](https://github.com/callstack/linaria/compare/v3.0.0-beta.13...v3.0.0-beta.14) (2021-11-05)

**Note:** Version bump only for package linaria-website

# [3.0.0-beta.13](https://github.com/callstack/linaria/compare/v3.0.0-beta.12...v3.0.0-beta.13) (2021-09-13)

**Note:** Version bump only for package linaria-website

# [3.0.0-beta.12](https://github.com/callstack/linaria/compare/v3.0.0-beta.11...v3.0.0-beta.12) (2021-08-31)

**Note:** Version bump only for package linaria-website

# [3.0.0-beta.11](https://github.com/callstack/linaria/compare/v3.0.0-beta.10...v3.0.0-beta.11) (2021-08-08)

**Note:** Version bump only for package linaria-website

# [3.0.0-beta.7](https://github.com/callstack/linaria/compare/v3.0.0-beta.6...v3.0.0-beta.7) (2021-06-24)

**Note:** Version bump only for package linaria-website

# [3.0.0-beta.6](https://github.com/callstack/linaria/compare/v3.0.0-beta.5...v3.0.0-beta.6) (2021-06-06)

**Note:** Version bump only for package linaria-website

# [3.0.0-beta.5](https://github.com/callstack/linaria/compare/v3.0.0-beta.4...v3.0.0-beta.5) (2021-05-31)

**Note:** Version bump only for package linaria-website

# [3.0.0-beta.4](https://github.com/callstack/linaria/compare/v3.0.0-beta.3...v3.0.0-beta.4) (2021-05-07)

**Note:** Version bump only for package linaria-website

# [3.0.0-beta.3](https://github.com/callstack/linaria/compare/v3.0.0-beta.2...v3.0.0-beta.3) (2021-04-20)

**Note:** Version bump only for package linaria-website

# [3.0.0-beta.2](https://github.com/callstack/linaria/compare/v3.0.0-beta.1...v3.0.0-beta.2) (2021-04-11)

**Note:** Version bump only for package linaria-website
