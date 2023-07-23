# Change Log

## 4.5.3

### Patch Changes

- Updated dependencies [79557248]
- Updated dependencies [b191f543]
- Updated dependencies [e59bf809]
- Updated dependencies [520ba8da]
- Updated dependencies [ae3727f9]
  - @linaria/babel-preset@4.5.3
  - @linaria/core@4.5.3
  - @linaria/react@4.5.3
  - @linaria/stylelint@4.5.3
  - @linaria/shaker@4.5.2
  - @linaria/rollup@4.5.3
  - @linaria/webpack4-loader@4.5.3

## 4.5.2

### Patch Changes

- Updated dependencies [85e74df6]
- Updated dependencies [1bf5c5b8]
  - @linaria/shaker@4.5.1
  - @linaria/babel-preset@4.5.2
  - @linaria/rollup@4.5.2
  - @linaria/webpack4-loader@4.5.2
  - @linaria/core@4.5.2
  - @linaria/react@4.5.2
  - @linaria/stylelint@4.5.2

## 4.5.1

### Patch Changes

- Updated dependencies [ceca1611]
- Updated dependencies [13258306]
  - @linaria/babel-preset@4.5.1
  - @linaria/react@4.5.1
  - @linaria/rollup@4.5.1
  - @linaria/stylelint@4.5.1
  - @linaria/webpack4-loader@4.5.1
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
- Updated dependencies [418e40af]
- Updated dependencies [05ad266c]
- Updated dependencies [16c057df]
- Updated dependencies [af5bb92d]
- Updated dependencies [10859924]
  - @linaria/babel-preset@4.5.0
  - @linaria/shaker@4.5.0
  - @linaria/react@4.5.0
  - @linaria/core@4.5.0
  - @linaria/extractor@4.5.0
  - @linaria/rollup@4.5.0
  - @linaria/server@4.5.0
  - @linaria/stylelint@4.5.0
  - @linaria/webpack4-loader@4.5.0

## 4.1.17

### Patch Changes

- Updated dependencies [821a6819]
- Updated dependencies [54ab61b2]
  - @linaria/babel-preset@4.4.5
  - @linaria/react@4.3.8
  - @linaria/shaker@4.2.11
  - @linaria/rollup@4.3.8
  - @linaria/stylelint@4.1.17
  - @linaria/webpack4-loader@4.1.17
  - @linaria/core@4.2.10

## 4.1.16

### Patch Changes

- Updated dependencies [1c3f309d]
- Updated dependencies [dbe250b5]
- Updated dependencies [34029088]
- Updated dependencies [a62e7ba6]
  - @linaria/babel-preset@4.4.4
  - @linaria/react@4.3.7
  - @linaria/shaker@4.2.10
  - @linaria/core@4.2.9
  - @linaria/rollup@4.3.7
  - @linaria/stylelint@4.1.16
  - @linaria/webpack4-loader@4.1.16

## 4.1.15

### Patch Changes

- Updated dependencies [a3ad617f]
  - @linaria/react@4.3.6
  - @linaria/babel-preset@4.4.3
  - @linaria/core@4.2.8
  - @linaria/rollup@4.3.6
  - @linaria/stylelint@4.1.15
  - @linaria/webpack4-loader@4.1.15

## 4.1.14

### Patch Changes

- Updated dependencies [13f0b416]
- Updated dependencies [f9df4ed8]
  - @linaria/rollup@4.3.5
  - @linaria/babel-preset@4.4.2
  - @linaria/stylelint@4.1.14
  - @linaria/webpack4-loader@4.1.14
  - @linaria/core@4.2.7
  - @linaria/react@4.3.5
  - @linaria/shaker@4.2.9

## 4.1.13

### Patch Changes

- Updated dependencies [917db446]
- Updated dependencies [57c0dc4f]
  - @linaria/babel-preset@4.4.1
  - @linaria/rollup@4.3.4
  - @linaria/stylelint@4.1.13
  - @linaria/webpack4-loader@4.1.13

## 4.1.12

### Patch Changes

- Updated dependencies [b27f328f]
- Updated dependencies [9cf41fae]
- Updated dependencies [860b8d21]
- Updated dependencies [af783273]
- Updated dependencies [28f3f93d]
- Updated dependencies [1d4d6833]
- Updated dependencies [71a5b351]
- Updated dependencies [cf1d6611]
- Updated dependencies [2d3a741f]
- Updated dependencies [61d49a39]
  - @linaria/shaker@4.2.8
  - @linaria/babel-preset@4.4.0
  - @linaria/rollup@4.3.3
  - @linaria/stylelint@4.1.12
  - @linaria/webpack4-loader@4.1.12
  - @linaria/core@4.2.6
  - @linaria/react@4.3.4

## 4.1.11

### Patch Changes

- Updated dependencies [3ce985e0]
- Updated dependencies [77bcf2e7]
  - @linaria/babel-preset@4.3.3
  - @linaria/server@4.1.0
  - @linaria/rollup@4.3.2
  - @linaria/stylelint@4.1.11
  - @linaria/webpack4-loader@4.1.11
  - @linaria/core@4.2.5
  - @linaria/react@4.3.3
  - @linaria/shaker@4.2.7

## 4.1.10

### Patch Changes

- Updated dependencies [edbf3cf1]
- Updated dependencies [315f0366]
  - @linaria/rollup@4.3.1
  - @linaria/babel-preset@4.3.2
  - @linaria/core@4.2.4
  - @linaria/react@4.3.2
  - @linaria/shaker@4.2.6
  - @linaria/stylelint@4.1.10
  - @linaria/webpack4-loader@4.1.10

## 4.1.9

### Patch Changes

- Updated dependencies [e2224348]
- Updated dependencies [655c4f2c]
- Updated dependencies [922f20d6]
- Updated dependencies [5edde648]
- Updated dependencies [e6420897]
- Updated dependencies [b9e49b74]
  - @linaria/shaker@4.2.5
  - @linaria/rollup@4.3.0
  - @linaria/react@4.3.1
  - @linaria/babel-preset@4.3.1
  - @linaria/core@4.2.3
  - @linaria/stylelint@4.1.9
  - @linaria/webpack4-loader@4.1.9

## 4.1.8

### Patch Changes

- Updated dependencies [63f56d47]
- Updated dependencies [963508a2]
- Updated dependencies [c26d4667]
  - @linaria/babel-preset@4.3.0
  - @linaria/react@4.3.0
  - @linaria/shaker@4.2.4
  - @linaria/rollup@4.2.2
  - @linaria/stylelint@4.1.8
  - @linaria/webpack4-loader@4.1.8
  - @linaria/core@4.2.2

## 4.1.7

### Patch Changes

- Updated dependencies [cc2f87a8]
- Updated dependencies [6de22792]
  - @linaria/babel-preset@4.2.4
  - @linaria/shaker@4.2.3
  - @linaria/react@4.2.1
  - @linaria/rollup@4.2.1
  - @linaria/stylelint@4.1.7
  - @linaria/webpack4-loader@4.1.7
  - @linaria/core@4.2.1

## 4.1.6

### Patch Changes

- Updated dependencies [1e88e95d]
- Updated dependencies [9111b4ea]
  - @linaria/core@4.2.0
  - @linaria/react@4.2.0
  - @linaria/rollup@4.2.0
  - @linaria/babel-preset@4.2.3
  - @linaria/stylelint@4.1.6
  - @linaria/webpack4-loader@4.1.6

## 4.1.5

### Patch Changes

- Updated dependencies [8a8be242]
- Updated dependencies [2906ec1c]
- Updated dependencies [8a8be242]
- Updated dependencies [c2092f61]
- Updated dependencies [08304e09]
- Updated dependencies [87ffe61c]
  - @linaria/shaker@4.2.2
  - @linaria/webpack4-loader@4.1.5
  - @linaria/babel-preset@4.2.2
  - @linaria/rollup@4.1.5
  - @linaria/core@4.1.4
  - @linaria/react@4.1.5
  - @linaria/stylelint@4.1.5

## 4.1.4

### Patch Changes

- Updated dependencies [24b4a4bd]
  - @linaria/babel-preset@4.2.1
  - @linaria/shaker@4.2.1
  - @linaria/rollup@4.1.4
  - @linaria/stylelint@4.1.4
  - @linaria/webpack4-loader@4.1.4
  - @linaria/core@4.1.3
  - @linaria/react@4.1.4

## 4.1.3

### Patch Changes

- Updated dependencies [8590e134]
- Updated dependencies [f7351b09]
- Updated dependencies [c0bd271a]
- Updated dependencies [8f90fa75]
- Updated dependencies [a5169f16]
- Updated dependencies [ac0991a6]
  - @linaria/babel-preset@4.2.0
  - @linaria/shaker@4.2.0
  - @linaria/react@4.1.3
  - @linaria/webpack4-loader@4.1.3
  - @linaria/rollup@4.1.3
  - @linaria/stylelint@4.1.3
  - @linaria/core@4.1.2

## 4.1.2

### Patch Changes

- Updated dependencies [008a5d13]
- Updated dependencies [3c593aa8]
  - @linaria/webpack4-loader@4.1.2
  - @linaria/babel-preset@4.1.2
  - @linaria/rollup@4.1.2
  - @linaria/stylelint@4.1.2
  - @linaria/core@4.1.1
  - @linaria/shaker@4.1.2
  - @linaria/react@4.1.2

## 4.1.1

### Patch Changes

- Updated dependencies [21ba7a44]
- Updated dependencies [21ba7a44]
- Updated dependencies [21ba7a44]
- Updated dependencies [2abc55b3]
- Updated dependencies [21ba7a44]
  - @linaria/babel-preset@4.1.1
  - @linaria/react@4.1.1
  - @linaria/shaker@4.1.1
  - @linaria/rollup@4.1.1
  - @linaria/stylelint@4.1.1
  - @linaria/webpack4-loader@4.1.1

## 4.1.0

### Patch Changes

- Updated dependencies [92f6d871]
  - @linaria/babel-preset@4.1.0
  - @linaria/rollup@4.1.0
  - @linaria/stylelint@4.1.0
  - @linaria/webpack4-loader@4.1.0
  - @linaria/core@4.1.0
  - @linaria/shaker@4.1.0
  - @linaria/react@4.1.0

## 4.0.0

### Major Changes

- bc0cbeea: A completely new async mode with native support for Vite, Rollup, esbuild and Webpack resolvers.

  BREAKING CHANGES: Despite the fact, that it should be fully compatible with 3.0 and 2.0 branches, the new version of styles evaluator can have some serious bugs which can make your project unbuildable (however, since there is no runtime, if the build is finished successfully, everything will continue work as it was on 2.0 and 3.0). If you face some problems please let us know and we will fix it as soon as possible.

### Patch Changes

- 8be5650d: The repo has been migrated to PNPM and Turborepo
- ea41d440: New package @linaria/tags that contains all abstract logic for tags processors.
- Updated dependencies [f0cddda4]
  - @linaria/babel-preset@4.0.0
  - @linaria/core@4.0.0
  - @linaria/extractor@4.0.0
  - @linaria/react@4.0.0
  - @linaria/rollup@4.0.0
  - @linaria/server@4.0.0
  - @linaria/shaker@4.0.0
  - @linaria/stylelint@4.0.0
  - @linaria/webpack4-loader@4.0.0

## 3.0.0-beta.21

### Patch Changes

- Updated dependencies [17c83e34]
  - @linaria/react@3.0.0-beta.21
  - @linaria/babel-preset@3.0.0-beta.21
  - @linaria/core@3.0.0-beta.21
  - @linaria/extractor@3.0.0-beta.21
  - @linaria/rollup@3.0.0-beta.21
  - @linaria/shaker@3.0.0-beta.21
  - @linaria/stylelint@3.0.0-beta.21
  - @linaria/webpack4-loader@3.0.0-beta.21

## 3.0.0-beta.20

### Patch Changes

- 8be5650d: The repo has been migrated to PNPM and Turborepo
- Updated dependencies
  - @linaria/babel-preset@3.0.0-beta.20
  - @linaria/core@3.0.0-beta.20
  - @linaria/extractor@3.0.0-beta.20
  - @linaria/react@3.0.0-beta.20
  - @linaria/rollup@3.0.0-beta.20
  - @linaria/server@3.0.0-beta.20
  - @linaria/shaker@3.0.0-beta.20
  - @linaria/stylelint@3.0.0-beta.20
  - @linaria/webpack4-loader@3.0.0-beta.20

# [3.0.0-beta.19](https://github.com/callstack/linaria/compare/v3.0.0-beta.18...v3.0.0-beta.19) (2022-06-03)

### Features

- **babel:** api for custom tags ([#976](https://github.com/callstack/linaria/issues/976)) ([3285ccc](https://github.com/callstack/linaria/commit/3285ccc1d00449b78b3fc74087528cd38cbdd116))
- **babel:** new way for detecting tag imports ([#974](https://github.com/callstack/linaria/issues/974)) ([3305cfb](https://github.com/callstack/linaria/commit/3305cfb0c0f65abdacceeb7e6bad118c59f7d551))

# [3.0.0-beta.18](https://github.com/callstack/linaria/compare/v3.0.0-beta.17...v3.0.0-beta.18) (2022-04-01)

**Note:** Version bump only for package linaria

# [3.0.0-beta.17](https://github.com/callstack/linaria/compare/v3.0.0-beta.16...v3.0.0-beta.17) (2021-12-27)

**Note:** Version bump only for package linaria

# [3.0.0-beta.16](https://github.com/callstack/linaria/compare/v3.0.0-beta.15...v3.0.0-beta.16) (2021-12-01)

**Note:** Version bump only for package linaria

# [3.0.0-beta.15](https://github.com/callstack/linaria/compare/v3.0.0-beta.14...v3.0.0-beta.15) (2021-11-29)

**Note:** Version bump only for package linaria

# [3.0.0-beta.14](https://github.com/callstack/linaria/compare/v3.0.0-beta.13...v3.0.0-beta.14) (2021-11-05)

**Note:** Version bump only for package linaria

# [3.0.0-beta.13](https://github.com/callstack/linaria/compare/v3.0.0-beta.12...v3.0.0-beta.13) (2021-09-13)

**Note:** Version bump only for package linaria

# [3.0.0-beta.12](https://github.com/callstack/linaria/compare/v3.0.0-beta.11...v3.0.0-beta.12) (2021-08-31)

**Note:** Version bump only for package linaria

# [3.0.0-beta.11](https://github.com/callstack/linaria/compare/v3.0.0-beta.10...v3.0.0-beta.11) (2021-08-08)

**Note:** Version bump only for package linaria

# [3.0.0-beta.10](https://github.com/callstack/linaria/compare/v3.0.0-beta.9...v3.0.0-beta.10) (2021-07-24)

**Note:** Version bump only for package linaria

# [3.0.0-beta.9](https://github.com/callstack/linaria/compare/v3.0.0-beta.8...v3.0.0-beta.9) (2021-07-23)

**Note:** Version bump only for package linaria

# [3.0.0-beta.8](https://github.com/callstack/linaria/compare/v3.0.0-beta.7...v3.0.0-beta.8) (2021-07-18)

**Note:** Version bump only for package linaria

# [3.0.0-beta.7](https://github.com/callstack/linaria/compare/v3.0.0-beta.6...v3.0.0-beta.7) (2021-06-24)

**Note:** Version bump only for package linaria

# [3.0.0-beta.6](https://github.com/callstack/linaria/compare/v3.0.0-beta.5...v3.0.0-beta.6) (2021-06-06)

**Note:** Version bump only for package linaria

# [3.0.0-beta.5](https://github.com/callstack/linaria/compare/v3.0.0-beta.4...v3.0.0-beta.5) (2021-05-31)

**Note:** Version bump only for package linaria

# [3.0.0-beta.4](https://github.com/callstack/linaria/compare/v3.0.0-beta.3...v3.0.0-beta.4) (2021-05-07)

**Note:** Version bump only for package linaria

# [3.0.0-beta.3](https://github.com/callstack/linaria/compare/v3.0.0-beta.2...v3.0.0-beta.3) (2021-04-20)

**Note:** Version bump only for package linaria

# [3.0.0-beta.2](https://github.com/callstack/linaria/compare/v3.0.0-beta.1...v3.0.0-beta.2) (2021-04-11)

**Note:** Version bump only for package linaria
