# Change Log

## 4.3.1

### Patch Changes

- 71a5b351: Workaround for weirdly packaged cjs modules.
- 61d49a39: Fix for #1112 "Cannot read properties of undefined (reading 'localeCompare')"

## 4.3.0

### Minor Changes

- d11174d0: Add option to remove var() wrapper around css variables

### Patch Changes

- 3ce985e0: Update tags processor to insert appropriate import/request for ESM/CommonJS.

## 4.2.6

### Patch Changes

- 315f0366: Support for code transpiled with esbuild.

## 4.2.5

### Patch Changes

- 5edde648: Upgrade Babel to support TypeScript 4.9. Fixes #1133.
- b9e49b74: Support for code transpiled with SWC.

## 4.2.4

### Patch Changes

- 963508a2: Shaker shouldn't remove parameters of functions if they aren't used.

## 4.2.3

### Patch Changes

- cc2f87a8: Get rid of "expected node to be of a type" errors

## 4.2.2

### Patch Changes

- 8a8be242: Fix an incorrect dead-code detection when a function has a parameter with the same name as the function itself. Fixes #1055
- 8a8be242: Fix rare use case when `void`-expression causes too aggressive tree-shaking. Fixes #1055.
- 08304e09: Fix support of re-exports compiled by tsc
- 87ffe61c: The new `variableNameSlug` option that allows to customize css variable names (closes #1053).

## 4.2.1

### Patch Changes

- 24b4a4bd: Fix function usage in string literals. Fixes #1047.

## 4.2.0

### Minor Changes

- f7351b09: In some cases, different parts of babel-preset could use different versions of installed @babel/core. It caused the ".key is not a valid Plugin property" error. Fixed.

### Patch Changes

- 8590e134: Fix for incorrect shaker behaviour when it tries to keep a function declaration with a removed body (fixes #1036).
- 8f90fa75: If an expression in a string literal is deleted during preeval stage, it should be replaced with an empty string. Fixes #1039.
- ac0991a6: Better detection for jsx-runtime. Reduces the amount of evaluated code and improves speed and stability.

## 4.1.1

### Patch Changes

- 50bc0c79: Fix for "Property key of ClassMethod expected to be" (fixes #1030)

## 4.1.0

### Patch Changes

- 92f6d871: Shaker tried to keep alive object methods even if their body was removed (fixes #1018)

## 4.0.0

### Major Changes

- bc0cbeea: A completely new async mode with native support for Vite, Rollup, esbuild and Webpack resolvers.

  BREAKING CHANGES: Despite the fact, that it should be fully compatible with 3.0 and 2.0 branches, the new version of styles evaluator can have some serious bugs which can make your project unbuildable (however, since there is no runtime, if the build is finished successfully, everything will continue work as it was on 2.0 and 3.0). If you face some problems please let us know and we will fix it as soon as possible.

### Patch Changes

- 8be5650d: The repo has been migrated to PNPM and Turborepo
- b8515929: In some cases, the shaker mistakenly removed assignment expressions. Fixes #1008.
- ea41d440: New package @linaria/tags that contains all abstract logic for tags processors.
- Updated dependencies [ea41d440]
  - @linaria/logger@4.0.0

## 3.0.0-beta.20

### Patch Changes

- 8be5650d: The repo has been migrated to PNPM and Turborepo

# [3.0.0-beta.19](https://github.com/callstack/linaria/compare/v3.0.0-beta.18...v3.0.0-beta.19) (2022-06-03)

### Features

- **babel:** api for custom tags ([#976](https://github.com/callstack/linaria/issues/976)) ([3285ccc](https://github.com/callstack/linaria/commit/3285ccc1d00449b78b3fc74087528cd38cbdd116))
- **babel:** new way for detecting tag imports ([#974](https://github.com/callstack/linaria/issues/974)) ([3305cfb](https://github.com/callstack/linaria/commit/3305cfb0c0f65abdacceeb7e6bad118c59f7d551))

# [3.0.0-beta.18](https://github.com/callstack/linaria/compare/v3.0.0-beta.17...v3.0.0-beta.18) (2022-04-01)

### Features

- **atomic:** string serialization of atoms ([#934](https://github.com/callstack/linaria/issues/934)) ([ef19ccb](https://github.com/callstack/linaria/commit/ef19ccb384cb7dbee561e789f637b0289d4d224c))

# [3.0.0-beta.15](https://github.com/callstack/linaria/compare/v3.0.0-beta.14...v3.0.0-beta.15) (2021-11-29)

### Features

- **atomic:** create an atomic package for the css API ([#867](https://github.com/callstack/linaria/issues/867)) ([4773bcf](https://github.com/callstack/linaria/commit/4773bcf4b14f08cdc4d2b612654b962cdfc97eaa))
