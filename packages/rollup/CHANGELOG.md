# Change Log

## 4.5.3

### Patch Changes

- Updated dependencies [79557248]
- Updated dependencies [b191f543]
- Updated dependencies [e59bf809]
- Updated dependencies [520ba8da]
- Updated dependencies [ae3727f9]
- Updated dependencies [dca076ef]
  - @linaria/babel-preset@4.5.3
  - @linaria/utils@4.5.2
  - @linaria/vite@4.5.3

## 4.5.2

### Patch Changes

- 1bf5c5b8: The cache has been improved, which should address the build time issues for Webpack 4/5 and resolve HMR-related problems for Vite. Fixes #1199, #1265 and maybe some more.
- Updated dependencies [85e74df6]
- Updated dependencies [cceaac99]
- Updated dependencies [1bf5c5b8]
  - @linaria/utils@4.5.1
  - @linaria/vite@4.5.2
  - @linaria/babel-preset@4.5.2

## 4.5.1

### Patch Changes

- Updated dependencies [ceca1611]
- Updated dependencies [13258306]
  - @linaria/babel-preset@4.5.1
  - @linaria/vite@4.5.1

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
- Updated dependencies [a6a29da7]
  - @linaria/utils@4.5.0
  - @linaria/babel-preset@4.5.0
  - @linaria/logger@4.5.0
  - @linaria/vite@4.5.0

## 4.3.8

### Patch Changes

- Updated dependencies [821a6819]
- Updated dependencies [54ab61b2]
  - @linaria/babel-preset@4.4.5
  - @linaria/utils@4.3.4
  - @linaria/vite@4.2.11

## 4.3.7

### Patch Changes

- Updated dependencies [1c3f309d]
- Updated dependencies [dbe250b5]
- Updated dependencies [a62e7ba6]
  - @linaria/babel-preset@4.4.4
  - @linaria/utils@4.3.3
  - @linaria/vite@4.2.10

## 4.3.6

### Patch Changes

- @linaria/babel-preset@4.4.3
- @linaria/vite@4.2.9

## 4.3.5

### Patch Changes

- 13f0b416: Fallback resolver for external libraries when bundling with Rollup or Vite.
- Updated dependencies [13f0b416]
- Updated dependencies [f9df4ed8]
  - @linaria/vite@4.2.8
  - @linaria/babel-preset@4.4.2
  - @linaria/utils@4.3.2

## 4.3.4

### Patch Changes

- Updated dependencies [917db446]
- Updated dependencies [57c0dc4f]
  - @linaria/babel-preset@4.4.1
  - @linaria/vite@4.2.7

## 4.3.3

### Patch Changes

- Updated dependencies [9cf41fae]
- Updated dependencies [860b8d21]
- Updated dependencies [af783273]
- Updated dependencies [28f3f93d]
- Updated dependencies [1d4d6833]
- Updated dependencies [71a5b351]
- Updated dependencies [ed20e6c7]
- Updated dependencies [2d3a741f]
- Updated dependencies [61d49a39]
  - @linaria/babel-preset@4.4.0
  - @linaria/utils@4.3.1
  - @linaria/vite@4.2.6

## 4.3.2

### Patch Changes

- Updated dependencies [3ce985e0]
- Updated dependencies [7c309666]
- Updated dependencies [017deab7]
- Updated dependencies [d11174d0]
  - @linaria/babel-preset@4.3.3
  - @linaria/utils@4.3.0
  - @linaria/vite@4.2.5

## 4.3.1

### Patch Changes

- edbf3cf1: esbuild and rollup now are peer dependencies. Fixes #1139.
- Updated dependencies [b874f299]
- Updated dependencies [315f0366]
  - @linaria/vite@4.2.4
  - @linaria/utils@4.2.6
  - @linaria/babel-preset@4.3.2

## 4.3.0

### Minor Changes

- 655c4f2c: Make rollup standalone. The support for Vite in @linaria/rollup is deprecated and will be removed in the next major version.

### Patch Changes

- Updated dependencies [5edde648]
- Updated dependencies [655c4f2c]
- Updated dependencies [b9e49b74]
  - @linaria/babel-preset@4.3.1
  - @linaria/utils@4.2.5
  - @linaria/vite@4.2.3

## 4.2.2

### Patch Changes

- Updated dependencies [63f56d47]
- Updated dependencies [963508a2]
  - @linaria/babel-preset@4.3.0
  - @linaria/utils@4.2.4

## 4.2.1

### Patch Changes

- Updated dependencies [cc2f87a8]
  - @linaria/babel-preset@4.2.4
  - @linaria/utils@4.2.3

## 4.2.0

### Minor Changes

- 1e88e95d: Support for ECMAScript modules. Fixes #904 and #1043.

### Patch Changes

- Updated dependencies [9111b4ea]
  - @linaria/babel-preset@4.2.3

## 4.1.5

### Patch Changes

- c2092f61: Support for rollup@3 and vite@3 (fixes #1044, #1060)
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

- 8be5650d: The repo has been migrated to PNPM and Turborepo
- ea41d440: New package @linaria/tags that contains all abstract logic for tags processors.
- Updated dependencies [f0cddda4]
  - @linaria/babel-preset@4.0.0
  - @linaria/logger@4.0.0
  - @linaria/utils@4.0.0

## 3.0.0-beta.21

### Patch Changes

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

**Note:** Version bump only for package @linaria/rollup

# [3.0.0-beta.17](https://github.com/callstack/linaria/compare/v3.0.0-beta.16...v3.0.0-beta.17) (2021-12-27)

**Note:** Version bump only for package @linaria/rollup

# [3.0.0-beta.15](https://github.com/callstack/linaria/compare/v3.0.0-beta.14...v3.0.0-beta.15) (2021-11-29)

**Note:** Version bump only for package @linaria/rollup

# [3.0.0-beta.14](https://github.com/callstack/linaria/compare/v3.0.0-beta.13...v3.0.0-beta.14) (2021-11-05)

**Note:** Version bump only for package @linaria/rollup

# [3.0.0-beta.13](https://github.com/callstack/linaria/compare/v3.0.0-beta.12...v3.0.0-beta.13) (2021-09-13)

### Bug Fixes

- **rollup:** rollup preserveModules no js extension ([#822](https://github.com/callstack/linaria/issues/822)) ([ca5232a](https://github.com/callstack/linaria/commit/ca5232ad389ae01937cafd0c360401507ddbcda2))

# [3.0.0-beta.12](https://github.com/callstack/linaria/compare/v3.0.0-beta.11...v3.0.0-beta.12) (2021-08-31)

**Note:** Version bump only for package @linaria/rollup

# [3.0.0-beta.7](https://github.com/callstack/linaria/compare/v3.0.0-beta.6...v3.0.0-beta.7) (2021-06-24)

**Note:** Version bump only for package @linaria/rollup

# [3.0.0-beta.6](https://github.com/callstack/linaria/compare/v3.0.0-beta.5...v3.0.0-beta.6) (2021-06-06)

### Bug Fixes

- **rollup:** compliant vite ([#763](https://github.com/callstack/linaria/issues/763)) ([3966dcf](https://github.com/callstack/linaria/commit/3966dcf03919430a7054ee7d6cf54aeaa715413c))

# [3.0.0-beta.5](https://github.com/callstack/linaria/compare/v3.0.0-beta.4...v3.0.0-beta.5) (2021-05-31)

**Note:** Version bump only for package @linaria/rollup

# [3.0.0-beta.4](https://github.com/callstack/linaria/compare/v3.0.0-beta.3...v3.0.0-beta.4) (2021-05-07)

**Note:** Version bump only for package @linaria/rollup

# [3.0.0-beta.3](https://github.com/callstack/linaria/compare/v3.0.0-beta.2...v3.0.0-beta.3) (2021-04-20)

**Note:** Version bump only for package @linaria/rollup

# [3.0.0-beta.2](https://github.com/callstack/linaria/compare/v3.0.0-beta.1...v3.0.0-beta.2) (2021-04-11)

**Note:** Version bump only for package @linaria/rollup
