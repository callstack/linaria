# Change Log

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
