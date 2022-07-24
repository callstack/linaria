# Change Log

## 4.0.0

### Major Changes

- bc0cbeea: A completely new async mode with native support for Vite, Rollup, esbuild and Webpack resolvers.

  BREAKING CHANGES: Despite the fact, that it should be fully compatible with 3.0 and 2.0 branches, the new version of styles evaluator can have some serious bugs which can make your project unbuildable (however, since there is no runtime, if the build is finished successfully, everything will continue work as it was on 2.0 and 3.0). If you face some problems please let us know and we will fix it as soon as possible.

### Patch Changes

- 8be5650d: The repo has been migrated to PNPM and Turborepo
- ea41d440: New package @linaria/tags that contains all abstract logic for tags processors.
- Updated dependencies [f0cddda4]
  - @linaria/babel-preset@4.0.0
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

### Bug Fixes

- **stylelint:** remove console.log from stylelint preprocessor ([#969](https://github.com/callstack/linaria/issues/969)) ([1ae913b](https://github.com/callstack/linaria/commit/1ae913b0e6091e95c8d9ee42d98bfbe78260d65d))

### Features

- **babel:** api for custom tags ([#976](https://github.com/callstack/linaria/issues/976)) ([3285ccc](https://github.com/callstack/linaria/commit/3285ccc1d00449b78b3fc74087528cd38cbdd116))
- **babel:** new way for detecting tag imports ([#974](https://github.com/callstack/linaria/issues/974)) ([3305cfb](https://github.com/callstack/linaria/commit/3305cfb0c0f65abdacceeb7e6bad118c59f7d551))

# [3.0.0-beta.18](https://github.com/callstack/linaria/compare/v3.0.0-beta.17...v3.0.0-beta.18) (2022-04-01)

**Note:** Version bump only for package @linaria/stylelint

# [3.0.0-beta.17](https://github.com/callstack/linaria/compare/v3.0.0-beta.16...v3.0.0-beta.17) (2021-12-27)

### Bug Fixes

- **react:** refactored types for styled function (fixes [#872](https://github.com/callstack/linaria/issues/872)) ([#887](https://github.com/callstack/linaria/issues/887)) ([7b8b129](https://github.com/callstack/linaria/commit/7b8b12937f9a0d1730d908e7cebad1684ccb03c3))

# [3.0.0-beta.15](https://github.com/callstack/linaria/compare/v3.0.0-beta.14...v3.0.0-beta.15) (2021-11-29)

### Bug Fixes

- **stylelint:** fix indentation errors (fixes [#693](https://github.com/callstack/linaria/issues/693)) ([#876](https://github.com/callstack/linaria/issues/876)) ([7f9f24f](https://github.com/callstack/linaria/commit/7f9f24f25018e45081efd2da98e70ebed0564da6))

# [3.0.0-beta.14](https://github.com/callstack/linaria/compare/v3.0.0-beta.13...v3.0.0-beta.14) (2021-11-05)

**Note:** Version bump only for package @linaria/stylelint

# [3.0.0-beta.13](https://github.com/callstack/linaria/compare/v3.0.0-beta.12...v3.0.0-beta.13) (2021-09-13)

**Note:** Version bump only for package @linaria/stylelint

# [3.0.0-beta.12](https://github.com/callstack/linaria/compare/v3.0.0-beta.11...v3.0.0-beta.12) (2021-08-31)

**Note:** Version bump only for package @linaria/stylelint

# [3.0.0-beta.7](https://github.com/callstack/linaria/compare/v3.0.0-beta.6...v3.0.0-beta.7) (2021-06-24)

**Note:** Version bump only for package @linaria/stylelint

# [3.0.0-beta.5](https://github.com/callstack/linaria/compare/v3.0.0-beta.4...v3.0.0-beta.5) (2021-05-31)

**Note:** Version bump only for package @linaria/stylelint

# [3.0.0-beta.4](https://github.com/callstack/linaria/compare/v3.0.0-beta.3...v3.0.0-beta.4) (2021-05-07)

**Note:** Version bump only for package @linaria/stylelint

# [3.0.0-beta.3](https://github.com/callstack/linaria/compare/v3.0.0-beta.2...v3.0.0-beta.3) (2021-04-20)

**Note:** Version bump only for package @linaria/stylelint

# [3.0.0-beta.2](https://github.com/callstack/linaria/compare/v3.0.0-beta.1...v3.0.0-beta.2) (2021-04-11)

**Note:** Version bump only for package @linaria/stylelint
