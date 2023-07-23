# Change Log

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
