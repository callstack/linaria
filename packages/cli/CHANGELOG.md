# Change Log

## 4.5.3

### Patch Changes

- e59bf809: Shaker mistakenly counts references in types as valuable and keeps referenced variables alive.
- 520ba8da: Debug mode for CLI, Webpack 5 and Vite. When enabled, prints brief perf report to console and information about processed dependency tree to the specified file.
- Updated dependencies [79557248]
- Updated dependencies [b191f543]
- Updated dependencies [e59bf809]
- Updated dependencies [520ba8da]
- Updated dependencies [ae3727f9]
- Updated dependencies [dca076ef]
  - @linaria/babel-preset@4.5.3
  - @linaria/utils@4.5.2

## 4.5.2

### Patch Changes

- Updated dependencies [85e74df6]
- Updated dependencies [1bf5c5b8]
  - @linaria/utils@4.5.1
  - @linaria/babel-preset@4.5.2

## 4.5.1

### Patch Changes

- Updated dependencies [ceca1611]
- Updated dependencies [13258306]
  - @linaria/babel-preset@4.5.1

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
- Updated dependencies [418e40af]
- Updated dependencies [05ad266c]
- Updated dependencies [16c057df]
- Updated dependencies [af5bb92d]
  - @linaria/utils@4.5.0
  - @linaria/babel-preset@4.5.0

## 4.1.17

### Patch Changes

- Updated dependencies [821a6819]
- Updated dependencies [54ab61b2]
  - @linaria/babel-preset@4.4.5
  - @linaria/utils@4.3.4

## 4.1.16

### Patch Changes

- Updated dependencies [1c3f309d]
- Updated dependencies [dbe250b5]
- Updated dependencies [a62e7ba6]
  - @linaria/babel-preset@4.4.4
  - @linaria/utils@4.3.3

## 4.1.15

### Patch Changes

- @linaria/babel-preset@4.4.3

## 4.1.14

### Patch Changes

- Updated dependencies [f9df4ed8]
  - @linaria/babel-preset@4.4.2
  - @linaria/utils@4.3.2

## 4.1.13

### Patch Changes

- Updated dependencies [917db446]
- Updated dependencies [57c0dc4f]
  - @linaria/babel-preset@4.4.1

## 4.1.12

### Patch Changes

- Updated dependencies [9cf41fae]
- Updated dependencies [860b8d21]
- Updated dependencies [af783273]
- Updated dependencies [28f3f93d]
- Updated dependencies [1d4d6833]
- Updated dependencies [71a5b351]
- Updated dependencies [2d3a741f]
- Updated dependencies [61d49a39]
  - @linaria/babel-preset@4.4.0
  - @linaria/utils@4.3.1

## 4.1.11

### Patch Changes

- Updated dependencies [3ce985e0]
- Updated dependencies [d11174d0]
  - @linaria/babel-preset@4.3.3
  - @linaria/utils@4.3.0

## 4.1.10

### Patch Changes

- Updated dependencies [315f0366]
  - @linaria/utils@4.2.6
  - @linaria/babel-preset@4.3.2

## 4.1.9

### Patch Changes

- 5edde648: Upgrade Babel to support TypeScript 4.9. Fixes #1133.
- Updated dependencies [5edde648]
- Updated dependencies [b9e49b74]
  - @linaria/babel-preset@4.3.1
  - @linaria/utils@4.2.5

## 4.1.8

### Patch Changes

- Updated dependencies [63f56d47]
- Updated dependencies [963508a2]
  - @linaria/babel-preset@4.3.0
  - @linaria/utils@4.2.4

## 4.1.7

### Patch Changes

- Updated dependencies [cc2f87a8]
  - @linaria/babel-preset@4.2.4
  - @linaria/utils@4.2.3

## 4.1.6

### Patch Changes

- Updated dependencies [9111b4ea]
  - @linaria/babel-preset@4.2.3

## 4.1.5

### Patch Changes

- Updated dependencies [8a8be242]
- Updated dependencies [8a8be242]
- Updated dependencies [c2092f61]
- Updated dependencies [08304e09]
- Updated dependencies [87ffe61c]
  - @linaria/utils@4.2.2
  - @linaria/babel-preset@4.2.2

## 4.1.4

### Patch Changes

- Updated dependencies [24b4a4bd]
  - @linaria/babel-preset@4.2.1
  - @linaria/utils@4.2.1

## 4.1.3

### Patch Changes

- Updated dependencies [8590e134]
- Updated dependencies [f7351b09]
- Updated dependencies [c0bd271a]
- Updated dependencies [8f90fa75]
- Updated dependencies [a5169f16]
- Updated dependencies [ac0991a6]
  - @linaria/babel-preset@4.2.0
  - @linaria/utils@4.2.0

## 4.1.2

### Patch Changes

- Updated dependencies [3c593aa8]
- Updated dependencies [50bc0c79]
  - @linaria/babel-preset@4.1.2
  - @linaria/utils@4.1.1

## 4.1.1

### Patch Changes

- c5ed76ed: CLI should write files only when all transforms are finished successfully.
- Updated dependencies [21ba7a44]
- Updated dependencies [21ba7a44]
- Updated dependencies [21ba7a44]
- Updated dependencies [2abc55b3]
- Updated dependencies [21ba7a44]
  - @linaria/babel-preset@4.1.1

## 4.1.0

### Patch Changes

- Updated dependencies [92f6d871]
  - @linaria/babel-preset@4.1.0
  - @linaria/utils@4.1.0

## 4.0.0

### Major Changes

- bc0cbeea: A completely new async mode with native support for Vite, Rollup, esbuild and Webpack resolvers.

  BREAKING CHANGES: Despite the fact, that it should be fully compatible with 3.0 and 2.0 branches, the new version of styles evaluator can have some serious bugs which can make your project unbuildable (however, since there is no runtime, if the build is finished successfully, everything will continue work as it was on 2.0 and 3.0). If you face some problems please let us know and we will fix it as soon as possible.

### Patch Changes

- 9a50c1c1: Option `transform` was required even if option `modules` was not specified.
- 8be5650d: The repo has been migrated to PNPM and Turborepo
- ea41d440: New package @linaria/tags that contains all abstract logic for tags processors.
- 9a50c1c1: Linaria now removes all unused css-related code from the runtime.
- ad8ea3b0: CLI now supports full inline transformations instead of just extracting styles. With the new flag --transform, Linaria CLI replaces template tags with their runtime representations.
- 782deb6f: Pass source-root option from CLI to babel-preset
- Updated dependencies [f0cddda4]
  - @linaria/babel-preset@4.0.0
  - @linaria/utils@4.0.0

## 3.0.0-beta.21

### Patch Changes

- ad8ea3b0: CLI now supports full inline transformations instead of just extracting styles. With the new flag --transform, Linaria CLI replaces template tags with their runtime representations.
- Updated dependencies [17c83e34]
  - @linaria/babel-preset@3.0.0-beta.21

## 3.0.0-beta.20

### Patch Changes

- 8be5650d: The repo has been migrated to PNPM and Turborepo
- Updated dependencies [8be5650d]
  - @linaria/babel-preset@3.0.0-beta.20

# [3.0.0-beta.19](https://github.com/callstack/linaria/compare/v3.0.0-beta.18...v3.0.0-beta.19) (2022-06-03)

### Features

- **babel:** api for custom tags ([#976](https://github.com/callstack/linaria/issues/976)) ([3285ccc](https://github.com/callstack/linaria/commit/3285ccc1d00449b78b3fc74087528cd38cbdd116))
- **babel:** new way for detecting tag imports ([#974](https://github.com/callstack/linaria/issues/974)) ([3305cfb](https://github.com/callstack/linaria/commit/3305cfb0c0f65abdacceeb7e6bad118c59f7d551))

# [3.0.0-beta.18](https://github.com/callstack/linaria/compare/v3.0.0-beta.17...v3.0.0-beta.18) (2022-04-01)

**Note:** Version bump only for package @linaria/cli

# [3.0.0-beta.17](https://github.com/callstack/linaria/compare/v3.0.0-beta.16...v3.0.0-beta.17) (2021-12-27)

**Note:** Version bump only for package @linaria/cli

# [3.0.0-beta.15](https://github.com/callstack/linaria/compare/v3.0.0-beta.14...v3.0.0-beta.15) (2021-11-29)

### Bug Fixes

- **cli:** cli trying to transform directories ([#856](https://github.com/callstack/linaria/issues/856)) ([14d9edd](https://github.com/callstack/linaria/commit/14d9edd3de5472af2fb7d7f12b22779fb59b2324))

# [3.0.0-beta.14](https://github.com/callstack/linaria/compare/v3.0.0-beta.13...v3.0.0-beta.14) (2021-11-05)

**Note:** Version bump only for package @linaria/cli

# [3.0.0-beta.13](https://github.com/callstack/linaria/compare/v3.0.0-beta.12...v3.0.0-beta.13) (2021-09-13)

**Note:** Version bump only for package @linaria/cli

# [3.0.0-beta.12](https://github.com/callstack/linaria/compare/v3.0.0-beta.11...v3.0.0-beta.12) (2021-08-31)

**Note:** Version bump only for package @linaria/cli

# [3.0.0-beta.7](https://github.com/callstack/linaria/compare/v3.0.0-beta.6...v3.0.0-beta.7) (2021-06-24)

**Note:** Version bump only for package @linaria/cli

# [3.0.0-beta.5](https://github.com/callstack/linaria/compare/v3.0.0-beta.4...v3.0.0-beta.5) (2021-05-31)

**Note:** Version bump only for package @linaria/cli

# [3.0.0-beta.4](https://github.com/callstack/linaria/compare/v3.0.0-beta.3...v3.0.0-beta.4) (2021-05-07)

### Bug Fixes

- **cli:** cannot find module '../lib/cli' ([#753](https://github.com/callstack/linaria/issues/753)) ([#754](https://github.com/callstack/linaria/issues/754)) ([fd7a09b](https://github.com/callstack/linaria/commit/fd7a09b4d4c7265e631b1d9c153362c87ed4132c))

# [3.0.0-beta.3](https://github.com/callstack/linaria/compare/v3.0.0-beta.2...v3.0.0-beta.3) (2021-04-20)

**Note:** Version bump only for package @linaria/cli

# [3.0.0-beta.2](https://github.com/callstack/linaria/compare/v3.0.0-beta.1...v3.0.0-beta.2) (2021-04-11)

### Bug Fixes

- resolve output filename relative to source root ([#733](https://github.com/callstack/linaria/issues/733)) ([c606b3f](https://github.com/callstack/linaria/commit/c606b3f9340f498e104905a954393df6fd48cb73))
