# Change Log

## 4.0.0

### Major Changes

- bc0cbeea: A completely new async mode with native support for Vite, Rollup, esbuild and Webpack resolvers.

  BREAKING CHANGES: Despite the fact, that it should be fully compatible with 3.0 and 2.0 branches, the new version of styles evaluator can have some serious bugs which can make your project unbuildable (however, since there is no runtime, if the build is finished successfully, everything will continue work as it was on 2.0 and 3.0). If you face some problems please let us know and we will fix it as soon as possible.

### Patch Changes

- 8be5650d: The repo has been migrated to PNPM and Turborepo
- ea41d440: New package @linaria/tags that contains all abstract logic for tags processors.
- 0d67095c: Fix for broken source maps in the esbuild plugin
- 1cbd27dd: Fix for regression from #955 that broke all imports.
- Updated dependencies [f0cddda4]
  - @linaria/babel-preset@4.0.0
  - @linaria/utils@4.0.0

## 3.0.0-beta.21

### Patch Changes

- 1cbd27dd: Fix for regression from #955 that broke all imports.
- Updated dependencies [17c83e34]
  - @linaria/babel-preset@3.0.0-beta.21

## 3.0.0-beta.20

### Patch Changes

- 8be5650d: The repo has been migrated to PNPM and Turborepo
- Updated dependencies [8be5650d]
  - @linaria/babel-preset@3.0.0-beta.20

# [3.0.0-beta.19](https://github.com/callstack/linaria/compare/v3.0.0-beta.18...v3.0.0-beta.19) (2022-06-03)

### Bug Fixes

- **esbuild:** add add missing loader and resolveDir ([#955](https://github.com/callstack/linaria/issues/955)) ([ef1051f](https://github.com/callstack/linaria/commit/ef1051ff81a9a147743d798b1262c5f49a41b14b))

### Features

- **babel:** api for custom tags ([#976](https://github.com/callstack/linaria/issues/976)) ([3285ccc](https://github.com/callstack/linaria/commit/3285ccc1d00449b78b3fc74087528cd38cbdd116))
- **babel:** new way for detecting tag imports ([#974](https://github.com/callstack/linaria/issues/974)) ([3305cfb](https://github.com/callstack/linaria/commit/3305cfb0c0f65abdacceeb7e6bad118c59f7d551))

# [3.0.0-beta.18](https://github.com/callstack/linaria/compare/v3.0.0-beta.17...v3.0.0-beta.18) (2022-04-01)

**Note:** Version bump only for package @linaria/esbuild

# [3.0.0-beta.17](https://github.com/callstack/linaria/compare/v3.0.0-beta.16...v3.0.0-beta.17) (2021-12-27)

**Note:** Version bump only for package @linaria/esbuild

# [3.0.0-beta.15](https://github.com/callstack/linaria/compare/v3.0.0-beta.14...v3.0.0-beta.15) (2021-11-29)

**Note:** Version bump only for package @linaria/esbuild

# [3.0.0-beta.14](https://github.com/callstack/linaria/compare/v3.0.0-beta.13...v3.0.0-beta.14) (2021-11-05)

**Note:** Version bump only for package @linaria/esbuild

# [3.0.0-beta.13](https://github.com/callstack/linaria/compare/v3.0.0-beta.12...v3.0.0-beta.13) (2021-09-13)

**Note:** Version bump only for package @linaria/esbuild

# [3.0.0-beta.12](https://github.com/callstack/linaria/compare/v3.0.0-beta.11...v3.0.0-beta.12) (2021-08-31)

**Note:** Version bump only for package @linaria/esbuild

# [3.0.0-beta.8](https://github.com/callstack/linaria/compare/v3.0.0-beta.7...v3.0.0-beta.8) (2021-07-18)

### Bug Fixes

- **esbuild:** add missing resolveDir to support webfont bundling ([#789](https://github.com/callstack/linaria/issues/789)) ([45e5de0](https://github.com/callstack/linaria/commit/45e5de06cef880a3b3524e2fed5cec313903cc43))

# [3.0.0-beta.7](https://github.com/callstack/linaria/compare/v3.0.0-beta.6...v3.0.0-beta.7) (2021-06-24)

### Bug Fixes

- **esbuild:** import esbuild correctly ([#783](https://github.com/callstack/linaria/issues/783)) ([a22522b](https://github.com/callstack/linaria/commit/a22522b0c91eefa12a10f67caf27ecb2954d8d1d))
- **esbuild:** workaround to for esbuild compile options ([#784](https://github.com/callstack/linaria/issues/784)) ([ac47f43](https://github.com/callstack/linaria/commit/ac47f43d7d2f692ef57b12573fdacdde72c25e19))

# [3.0.0-beta.6](https://github.com/callstack/linaria/compare/v3.0.0-beta.5...v3.0.0-beta.6) (2021-06-06)

### Features

- add esbuild integration ([#765](https://github.com/callstack/linaria/issues/765)) ([511a717](https://github.com/callstack/linaria/commit/511a7178fd9c77fb971d392067b0f7ea8fcd30a4))
