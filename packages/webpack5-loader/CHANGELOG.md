# Change Log

## 4.5.3

### Patch Changes

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

- 1bf5c5b8: The cache has been improved, which should address the build time issues for Webpack 4/5 and resolve HMR-related problems for Vite. Fixes #1199, #1265 and maybe some more.
- Updated dependencies [1bf5c5b8]
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
- Updated dependencies [418e40af]
- Updated dependencies [16c057df]
- Updated dependencies [af5bb92d]
  - @linaria/babel-preset@4.5.0
  - @linaria/logger@4.5.0

## 4.1.17

### Patch Changes

- Updated dependencies [821a6819]
  - @linaria/babel-preset@4.4.5

## 4.1.16

### Patch Changes

- Updated dependencies [1c3f309d]
- Updated dependencies [dbe250b5]
- Updated dependencies [a62e7ba6]
  - @linaria/babel-preset@4.4.4

## 4.1.15

### Patch Changes

- @linaria/babel-preset@4.4.3

## 4.1.14

### Patch Changes

- Updated dependencies [f9df4ed8]
  - @linaria/babel-preset@4.4.2

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
- Updated dependencies [2d3a741f]
- Updated dependencies [61d49a39]
  - @linaria/babel-preset@4.4.0

## 4.1.11

### Patch Changes

- Updated dependencies [3ce985e0]
  - @linaria/babel-preset@4.3.3

## 4.1.10

### Patch Changes

- Updated dependencies [315f0366]
  - @linaria/babel-preset@4.3.2

## 4.1.9

### Patch Changes

- Updated dependencies [5edde648]
- Updated dependencies [b9e49b74]
  - @linaria/babel-preset@4.3.1

## 4.1.8

### Patch Changes

- Updated dependencies [63f56d47]
  - @linaria/babel-preset@4.3.0

## 4.1.7

### Patch Changes

- Updated dependencies [cc2f87a8]
  - @linaria/babel-preset@4.2.4

## 4.1.6

### Patch Changes

- Updated dependencies [9111b4ea]
  - @linaria/babel-preset@4.2.3

## 4.1.5

### Patch Changes

- 2906ec1c: Watch dependencies from cached css files in webpack watch mode.
- Updated dependencies [c2092f61]
- Updated dependencies [08304e09]
  - @linaria/babel-preset@4.2.2

## 4.1.4

### Patch Changes

- Updated dependencies [24b4a4bd]
  - @linaria/babel-preset@4.2.1

## 4.1.3

### Patch Changes

- c0bd271a: Sometimes Linaria can meet already processed code. In such a case, it shall ignore runtime versions of `styled` tags. Fixes #1037.
- Updated dependencies [8590e134]
- Updated dependencies [f7351b09]
- Updated dependencies [c0bd271a]
- Updated dependencies [8f90fa75]
- Updated dependencies [a5169f16]
- Updated dependencies [ac0991a6]
  - @linaria/babel-preset@4.2.0

## 4.1.2

### Patch Changes

- 008a5d13: Fix webpack crash when an error in Linaria happens. (fixes #1029)
- Updated dependencies [3c593aa8]
  - @linaria/babel-preset@4.1.2

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

## 4.0.0

### Major Changes

- bc0cbeea: A completely new async mode with native support for Vite, Rollup, esbuild and Webpack resolvers.

  BREAKING CHANGES: Despite the fact, that it should be fully compatible with 3.0 and 2.0 branches, the new version of styles evaluator can have some serious bugs which can make your project unbuildable (however, since there is no runtime, if the build is finished successfully, everything will continue work as it was on 2.0 and 3.0). If you face some problems please let us know and we will fix it as soon as possible.

### Patch Changes

- 3111ca8d: Since stringifyRequest was removed from loader-utils@3, we removed loader-utils. (fix #977)
- 8be5650d: The repo has been migrated to PNPM and Turborepo
- ea41d440: New package @linaria/tags that contains all abstract logic for tags processors.
- Updated dependencies [f0cddda4]
  - @linaria/babel-preset@4.0.0
  - @linaria/logger@4.0.0

## 3.0.0-beta.21

### Patch Changes

- Updated dependencies [17c83e34]
  - @linaria/babel-preset@3.0.0-beta.21

## 3.0.0-beta.20

### Patch Changes

- Since stringifyRequest was removed from loader-utils@3, we removed loader-utils. (fix #977)
- 8be5650d: The repo has been migrated to PNPM and Turborepo
- Updated dependencies [8be5650d]
  - @linaria/babel-preset@3.0.0-beta.20
  - @linaria/logger@3.0.0-beta.20

# [3.0.0-beta.19](https://github.com/callstack/linaria/compare/v3.0.0-beta.18...v3.0.0-beta.19) (2022-06-03)

### Features

- **babel:** api for custom tags ([#976](https://github.com/callstack/linaria/issues/976)) ([3285ccc](https://github.com/callstack/linaria/commit/3285ccc1d00449b78b3fc74087528cd38cbdd116))
- **babel:** new way for detecting tag imports ([#974](https://github.com/callstack/linaria/issues/974)) ([3305cfb](https://github.com/callstack/linaria/commit/3305cfb0c0f65abdacceeb7e6bad118c59f7d551))

# [3.0.0-beta.18](https://github.com/callstack/linaria/compare/v3.0.0-beta.17...v3.0.0-beta.18) (2022-04-01)

**Note:** Version bump only for package @linaria/webpack5-loader

# [3.0.0-beta.17](https://github.com/callstack/linaria/compare/v3.0.0-beta.16...v3.0.0-beta.17) (2021-12-27)

### Bug Fixes

- **webpack:** add cacheProvider for Linaria v3 ([#889](https://github.com/callstack/linaria/issues/889)) ([ee656dd](https://github.com/callstack/linaria/commit/ee656ddff76b17644f42cdba463778ade3dc9567))
- **webpack:** fix usage of webpackResolveOptions conditionally ([#883](https://github.com/callstack/linaria/issues/883)) ([3d6b6c5](https://github.com/callstack/linaria/commit/3d6b6c5d49d1740ec9b12e410bda33ccb8c7f459))

# [3.0.0-beta.16](https://github.com/callstack/linaria/compare/v3.0.0-beta.15...v3.0.0-beta.16) (2021-12-01)

### Bug Fixes

- **webpack:** replace file system cache with in-memory cache (fixes [#878](https://github.com/callstack/linaria/issues/878)) ([#879](https://github.com/callstack/linaria/issues/879)) ([5517cf7](https://github.com/callstack/linaria/commit/5517cf79c1a5dbf7c10d17be01cf4ac4470116f9))

# [3.0.0-beta.15](https://github.com/callstack/linaria/compare/v3.0.0-beta.14...v3.0.0-beta.15) (2021-11-29)

### Bug Fixes

- **webpack:** better merge for configs and fallback for async plugins ([#874](https://github.com/callstack/linaria/issues/874)) ([ad84d6d](https://github.com/callstack/linaria/commit/ad84d6dea9c753c873090b54f5c8583ac4086033)), closes [#855](https://github.com/callstack/linaria/issues/855)

# [3.0.0-beta.14](https://github.com/callstack/linaria/compare/v3.0.0-beta.13...v3.0.0-beta.14) (2021-11-05)

**Note:** Version bump only for package @linaria/webpack5-loader

# [3.0.0-beta.13](https://github.com/callstack/linaria/compare/v3.0.0-beta.12...v3.0.0-beta.13) (2021-09-13)

### Bug Fixes

- **webpack:** pass all user resolve options to loader (fixes [#658](https://github.com/callstack/linaria/issues/658)) ([#830](https://github.com/callstack/linaria/issues/830)) ([a0590e5](https://github.com/callstack/linaria/commit/a0590e5183b3ad3a93fd7adce61504fd85b4bcb1))

# [3.0.0-beta.12](https://github.com/callstack/linaria/compare/v3.0.0-beta.11...v3.0.0-beta.12) (2021-08-31)

**Note:** Version bump only for package @linaria/webpack5-loader

# [3.0.0-beta.7](https://github.com/callstack/linaria/compare/v3.0.0-beta.6...v3.0.0-beta.7) (2021-06-24)

### Bug Fixes

- webpack resolve options ([#785](https://github.com/callstack/linaria/issues/785)) ([64b2b06](https://github.com/callstack/linaria/commit/64b2b06edd873d7db0f36ef25a4b9d8389808eb2))

# [3.0.0-beta.6](https://github.com/callstack/linaria/compare/v3.0.0-beta.5...v3.0.0-beta.6) (2021-06-06)

### Bug Fixes

- **webpack:** hot reload fails after compile error (fixes [#762](https://github.com/callstack/linaria/issues/762)) ([#775](https://github.com/callstack/linaria/issues/775)) ([67fcd81](https://github.com/callstack/linaria/commit/67fcd8108f283f8ade23c68ad3fece8aee335bf1))

# [3.0.0-beta.5](https://github.com/callstack/linaria/compare/v3.0.0-beta.4...v3.0.0-beta.5) (2021-05-31)

**Note:** Version bump only for package @linaria/webpack5-loader

# [3.0.0-beta.4](https://github.com/callstack/linaria/compare/v3.0.0-beta.3...v3.0.0-beta.4) (2021-05-07)

**Note:** Version bump only for package @linaria/webpack5-loader

# [3.0.0-beta.3](https://github.com/callstack/linaria/compare/v3.0.0-beta.2...v3.0.0-beta.3) (2021-04-20)

**Note:** Version bump only for package @linaria/webpack5-loader

# [3.0.0-beta.2](https://github.com/callstack/linaria/compare/v3.0.0-beta.1...v3.0.0-beta.2) (2021-04-11)

**Note:** Version bump only for package @linaria/webpack5-loader
