# Change Log

## 6.3.0

### Minor Changes

- 281ca4f5: The new version of wyw-in-js, with the support of a configurable code remover, can help prevent compilation errors and improve build time.

### Patch Changes

- Updated dependencies [bd8d45fd]
- Updated dependencies [281ca4f5]
  - @linaria/react@6.3.0
  - @linaria/core@6.3.0

## 6.2.0

### Minor Changes

- a3dcee2e: Update wyw-in-js to 0.5.3

### Patch Changes

- Updated dependencies [a3dcee2e]
  - @linaria/core@6.2.0
  - @linaria/react@6.2.1

## 6.1.1

### Patch Changes

- Updated dependencies [fd60b5de]
  - @linaria/react@6.2.0

## 6.1.0

### Minor Changes

- 8ba655d3: Bump wyw-in-js to 0.4.0. The full list of changes https://github.com/Anber/wyw-in-js/compare/%40wyw-in-js/transform%400.2.3...%40wyw-in-js/transform%400.4.0

### Patch Changes

- 8d4ebd33: chore: bump @wyw-in-js/\* packages
- Updated dependencies [8d4ebd33]
- Updated dependencies [8ba655d3]
  - @linaria/core@6.1.0
  - @linaria/react@6.1.0

## 6.0.0

### Major Changes

- 60e6b7e2: Stylis has been upgraded from v3 to v4.
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

- Updated dependencies [2ac94b99]
  - @linaria/core@6.0.0
  - @linaria/react@6.0.0

## 5.0.3

### Patch Changes

- Updated dependencies [4b083b7c]
  - @linaria/react@5.0.3

## 5.0.2

### Patch Changes

- Updated dependencies [1e889937]
- Updated dependencies [4992c14d]
- Updated dependencies [70000ec8]
- Updated dependencies [1e889937]
- Updated dependencies [5a32f4fd]
- Updated dependencies [727dc2bd]
- Updated dependencies [25ba1344]
- Updated dependencies [5a32f4fd]
  - @linaria/react@5.0.2
  - @linaria/utils@5.0.2
  - @linaria/tags@5.0.2
  - @linaria/core@5.0.2

## 5.0.1

### Patch Changes

- Updated dependencies [6fb6eb69]
  - @linaria/utils@5.0.1
  - @linaria/core@5.0.1
  - @linaria/react@5.0.1
  - @linaria/tags@5.0.1

## 5.0.0

### Major Changes

- 88e07613: Rewritten dependecny tree processing with support for wildcard re-exports.
- cb853e14: All processing stages were merged into one generators-based processor. It allows the implementation of more complex workflows to support features like dynamic imports and re-exports.

### Minor Changes

- 9cb4143d: Refactoring of the 1st stage of transformation. It opens the road to processing wildcard reexports.

### Patch Changes

- 2a1e24a0: Upgrade TypeScript to 5.2
- Updated dependencies [9cb4143d]
- Updated dependencies [ae162f46]
- Updated dependencies [88e07613]
- Updated dependencies [b3ef8c1f]
- Updated dependencies [f8b9bff5]
- Updated dependencies [63902332]
- Updated dependencies [aa100453]
- Updated dependencies [9bb782d0]
- Updated dependencies [2a1e24a0]
- Updated dependencies [16320d71]
- Updated dependencies [cb853e14]
  - @linaria/core@5.0.0
  - @linaria/logger@5.0.0
  - @linaria/react@5.0.0
  - @linaria/tags@5.0.0
  - @linaria/utils@5.0.0

## 4.5.4

### Patch Changes

- Updated dependencies [10bcd241]
  - @linaria/utils@4.5.3
  - @linaria/core@4.5.4
  - @linaria/react@4.5.4
  - @linaria/tags@4.5.4

## 4.5.3

### Patch Changes

- 79557248: Nothing has changed. Just moved some utils and types from babel to utils package.
- e59bf809: Shaker mistakenly counts references in types as valuable and keeps referenced variables alive.
- Updated dependencies [79557248]
- Updated dependencies [b191f543]
- Updated dependencies [e59bf809]
- Updated dependencies [520ba8da]
- Updated dependencies [ae3727f9]
- Updated dependencies [dca076ef]
  - @linaria/core@4.5.3
  - @linaria/react@4.5.3
  - @linaria/tags@4.5.3
  - @linaria/utils@4.5.2

## 4.5.2

### Patch Changes

- Updated dependencies [85e74df6]
- Updated dependencies [1bf5c5b8]
  - @linaria/utils@4.5.1
  - @linaria/core@4.5.2
  - @linaria/react@4.5.2
  - @linaria/tags@4.5.2

## 4.5.1

### Patch Changes

- Updated dependencies [ceca1611]
- Updated dependencies [13258306]
  - @linaria/react@4.5.1
  - @linaria/tags@4.5.1
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
- Updated dependencies [890b4aca]
- Updated dependencies [05ad266c]
- Updated dependencies [16c057df]
- Updated dependencies [af5bb92d]
- Updated dependencies [10859924]
  - @linaria/utils@4.5.0
  - @linaria/react@4.5.0
  - @linaria/tags@4.5.0
  - @linaria/core@4.5.0
  - @linaria/logger@4.5.0

## 4.2.10

### Patch Changes

- Updated dependencies [54ab61b2]
  - @linaria/react@4.3.8
  - @linaria/tags@4.3.5
  - @linaria/utils@4.3.4
  - @linaria/core@4.2.10

## 4.2.9

### Patch Changes

- 34029088: Usages of `styled` and `css` in Jest no longer trigger the "Using the … tag in runtime is not supported" exception.
- Updated dependencies [2e966f23]
- Updated dependencies [1c3f309d]
- Updated dependencies [dbe250b5]
- Updated dependencies [34029088]
  - @linaria/tags@4.3.4
  - @linaria/react@4.3.7
  - @linaria/utils@4.3.3
  - @linaria/core@4.2.9

## 4.2.8

### Patch Changes

- Updated dependencies [a3ad617f]
  - @linaria/react@4.3.6
  - @linaria/tags@4.3.3
  - @linaria/core@4.2.8

## 4.2.7

### Patch Changes

- a2b618bc: add react as an optional peerDependency due to dependency on @atomic/react
- Updated dependencies [f9df4ed8]
  - @linaria/utils@4.3.2
  - @linaria/core@4.2.7
  - @linaria/react@4.3.5
  - @linaria/tags@4.3.2

## 4.2.6

### Patch Changes

- Updated dependencies [28f3f93d]
- Updated dependencies [71a5b351]
- Updated dependencies [61d49a39]
  - @linaria/tags@4.3.1
  - @linaria/utils@4.3.1
  - @linaria/core@4.2.6
  - @linaria/react@4.3.4

## 4.2.5

### Patch Changes

- 61fe2560: Do not crash when no styles are extracted.
- Updated dependencies [3ce985e0]
- Updated dependencies [d11174d0]
  - @linaria/tags@4.3.0
  - @linaria/utils@4.3.0
  - @linaria/core@4.2.5
  - @linaria/react@4.3.3

## 4.2.4

### Patch Changes

- Updated dependencies [315f0366]
  - @linaria/utils@4.2.6
  - @linaria/core@4.2.4
  - @linaria/react@4.3.2
  - @linaria/tags@4.2.2

## 4.2.3

### Patch Changes

- 5edde648: Upgrade Babel to support TypeScript 4.9. Fixes #1133.
- Updated dependencies [922f20d6]
- Updated dependencies [5edde648]
- Updated dependencies [b9e49b74]
  - @linaria/react@4.3.1
  - @linaria/core@4.2.3
  - @linaria/tags@4.2.1
  - @linaria/utils@4.2.5

## 4.2.2

### Patch Changes

- Updated dependencies [63f56d47]
- Updated dependencies [963508a2]
- Updated dependencies [c26d4667]
  - @linaria/react@4.3.0
  - @linaria/tags@4.2.0
  - @linaria/utils@4.2.4
  - @linaria/core@4.2.2

## 4.2.1

### Patch Changes

- Updated dependencies [cc2f87a8]
- Updated dependencies [6de22792]
  - @linaria/utils@4.2.3
  - @linaria/react@4.2.1
  - @linaria/core@4.2.1
  - @linaria/tags@4.1.5

## 4.2.0

### Minor Changes

- 1e88e95d: Support for ECMAScript modules. Fixes #904 and #1043.

### Patch Changes

- Updated dependencies [1e88e95d]
  - @linaria/core@4.2.0
  - @linaria/react@4.2.0

## 4.1.5

### Patch Changes

- 87ffe61c: The new `variableNameSlug` option that allows to customize css variable names (closes #1053).
- Updated dependencies [8a8be242]
- Updated dependencies [8a8be242]
- Updated dependencies [08304e09]
- Updated dependencies [87ffe61c]
  - @linaria/utils@4.2.2
  - @linaria/core@4.1.4
  - @linaria/react@4.1.5
  - @linaria/tags@4.1.4

## 4.1.4

### Patch Changes

- Updated dependencies [24b4a4bd]
  - @linaria/utils@4.2.1
  - @linaria/core@4.1.3
  - @linaria/tags@4.1.3
  - @linaria/react@4.1.4

## 4.1.3

### Patch Changes

- Updated dependencies [8590e134]
- Updated dependencies [f7351b09]
- Updated dependencies [c0bd271a]
- Updated dependencies [8f90fa75]
- Updated dependencies [ac0991a6]
  - @linaria/utils@4.2.0
  - @linaria/react@4.1.3
  - @linaria/tags@4.1.2
  - @linaria/core@4.1.2

## 4.1.2

### Patch Changes

- Updated dependencies [50bc0c79]
  - @linaria/utils@4.1.1
  - @linaria/core@4.1.1
  - @linaria/tags@4.1.1
  - @linaria/react@4.1.2

## 4.1.1

### Patch Changes

- Updated dependencies [2abc55b3]
  - @linaria/react@4.1.1

## 4.1.0

### Patch Changes

- Updated dependencies [92f6d871]
  - @linaria/utils@4.1.0
  - @linaria/core@4.1.0
  - @linaria/tags@4.1.0
  - @linaria/react@4.1.0

## 4.0.0

### Major Changes

- bc0cbeea: A completely new async mode with native support for Vite, Rollup, esbuild and Webpack resolvers.

  BREAKING CHANGES: Despite the fact, that it should be fully compatible with 3.0 and 2.0 branches, the new version of styles evaluator can have some serious bugs which can make your project unbuildable (however, since there is no runtime, if the build is finished successfully, everything will continue work as it was on 2.0 and 3.0). If you face some problems please let us know and we will fix it as soon as possible.

### Patch Changes

- 8be5650d: The repo has been migrated to PNPM and Turborepo
- ea41d440: New package @linaria/tags that contains all abstract logic for tags processors.
- 9a50c1c1: Linaria now removes all unused css-related code from the runtime.
- 12d35cb9: `processors` aliases have been lost during publishing. (fixes #984)
- 17c83e34: Aliases for environments without the support of `exports` in package.json.
- Updated dependencies [f0cddda4]
  - @linaria/core@4.0.0
  - @linaria/logger@4.0.0
  - @linaria/react@4.0.0
  - @linaria/utils@4.0.0
  - @linaria/tags@4.0.0

## 3.0.0-beta.21

### Patch Changes

- 17c83e34: Aliases for environments without the support of `exports` in package.json.
- Updated dependencies [17c83e34]
  - @linaria/react@3.0.0-beta.21
  - @linaria/core@3.0.0-beta.21

## 3.0.0-beta.20

### Patch Changes

- 8be5650d: The repo has been migrated to PNPM and Turborepo
- Updated dependencies
  - @linaria/core@3.0.0-beta.20
  - @linaria/logger@3.0.0-beta.20
  - @linaria/react@3.0.0-beta.20
  - @linaria/utils@3.0.0-beta.20

# [3.0.0-beta.19](https://github.com/callstack/linaria/compare/v3.0.0-beta.18...v3.0.0-beta.19) (2022-06-03)

### Features

- **atomic:** add support for atomic using styled API ([#966](https://github.com/callstack/linaria/issues/966)) ([f59860b](https://github.com/callstack/linaria/commit/f59860b09c5f91b0423dbf188e5f8aaaef38a6b5))
- **babel:** api for custom tags ([#976](https://github.com/callstack/linaria/issues/976)) ([3285ccc](https://github.com/callstack/linaria/commit/3285ccc1d00449b78b3fc74087528cd38cbdd116))
- **babel:** new way for detecting tag imports ([#974](https://github.com/callstack/linaria/issues/974)) ([3305cfb](https://github.com/callstack/linaria/commit/3305cfb0c0f65abdacceeb7e6bad118c59f7d551))

# [3.0.0-beta.18](https://github.com/callstack/linaria/compare/v3.0.0-beta.17...v3.0.0-beta.18) (2022-04-01)

### Features

- **atomic:** add property priorities ([#950](https://github.com/callstack/linaria/issues/950)) ([c44becb](https://github.com/callstack/linaria/commit/c44becb11b2eec795b68c2b3d0715672ba4b3888))
- **atomic:** add support for at-rules, keyframes and pseudo classes ([#913](https://github.com/callstack/linaria/issues/913)) ([dee7fa1](https://github.com/callstack/linaria/commit/dee7fa14ea912224cac9f0673be7464e93571a73))
- **atomic:** string serialization of atoms ([#934](https://github.com/callstack/linaria/issues/934)) ([ef19ccb](https://github.com/callstack/linaria/commit/ef19ccb384cb7dbee561e789f637b0289d4d224c))

# [3.0.0-beta.15](https://github.com/callstack/linaria/compare/v3.0.0-beta.14...v3.0.0-beta.15) (2021-11-29)

### Features

- **atomic:** create an atomic package for the css API ([#867](https://github.com/callstack/linaria/issues/867)) ([4773bcf](https://github.com/callstack/linaria/commit/4773bcf4b14f08cdc4d2b612654b962cdfc97eaa))
