# @linaria/testkit

## 4.0.0-beta.1

### Patch Changes

- ea41d440: New package @linaria/tags that contains all abstract logic for tags processors.
- Updated dependencies [b8515929]
- Updated dependencies [ea41d440]
  - @linaria/shaker@4.0.0-beta.1
  - @linaria/babel-preset@4.0.0-beta.1
  - @linaria/extractor@4.0.0-beta.1
  - @linaria/react@4.0.0-beta.1
  - @linaria/tags@4.0.0-beta.2

## 4.0.0-beta.0

### Major Changes

- bc0cbeea: A completely new async mode with native support for Vite, Rollup, esbuild and Webpack resolvers.

  BREAKING CHANGES: Despite the fact, that it should be fully compatible with 3.0 and 2.0 branches, the new version of styles evaluator can have some serious bugs which can make your project unbuildable (however, since there is no runtime, if the build is finished successfully, everything will continue work as it was on 2.0 and 3.0). If you face some problems please let us know and we will fix it as soon as possible.

### Patch Changes

- 9a50c1c1: Linaria now removes all unused css-related code from the runtime.
- Updated dependencies [bc0cbeea]
- Updated dependencies [bc0cbeea]
- Updated dependencies [9a50c1c1]
  - @linaria/babel-preset@4.0.0-beta.0
  - @linaria/extractor@4.0.0-beta.0
  - @linaria/react@4.0.0-beta.0
  - @linaria/shaker@4.0.0-beta.0

## 3.0.0-beta.22

### Patch Changes

- 592b89b5: Fix for broken object interpolation (#995)
- Updated dependencies [592b89b5]
- Updated dependencies [12d35cb9]
- Updated dependencies [782deb6f]
  - @linaria/babel-preset@3.0.0-beta.22
  - @linaria/react@3.0.0-beta.22
  - @linaria/extractor@3.0.0-beta.22
  - @linaria/preeval@3.0.0-beta.22
  - @linaria/shaker@3.0.0-beta.22

## 3.0.0-beta.21

### Patch Changes

- 17c83e34: Aliases for environments without the support of `exports` in package.json.
- Updated dependencies [609d79ba]
- Updated dependencies [17c83e34]
- Updated dependencies [17c83e34]
  - @linaria/react@3.0.0-beta.21
  - @linaria/babel-preset@3.0.0-beta.21
  - @linaria/extractor@3.0.0-beta.21
  - @linaria/preeval@3.0.0-beta.21
  - @linaria/shaker@3.0.0-beta.21

## 3.0.0-beta.20

### Patch Changes

- 8be5650d: The repo has been migrated to PNPM and Turborepo
- Updated dependencies [8be5650d]
- Updated dependencies
  - @linaria/babel-preset@3.0.0-beta.20
  - @linaria/extractor@3.0.0-beta.20
  - @linaria/preeval@3.0.0-beta.20
  - @linaria/react@3.0.0-beta.20
  - @linaria/shaker@3.0.0-beta.20
