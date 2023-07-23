# Change Log

## 4.5.2

### Patch Changes

- 79557248: Nothing has changed. Just moved some utils and types from babel to utils package.
- b191f543: New option `features` for fine-tuning the build and evaluation process.
- e59bf809: Shaker mistakenly counts references in types as valuable and keeps referenced variables alive.
- 520ba8da: Debug mode for CLI, Webpack 5 and Vite. When enabled, prints brief perf report to console and information about processed dependency tree to the specified file.
- ae3727f9: Fix the issues with processing files that are supposed to be parsed with their respective Babel config.
- dca076ef: All references in unary operators should be treated as references, not as bindings. That fixes usages of `+exp` in interpolations.

## 4.5.1

### Patch Changes

- 85e74df6: Fix: type imports without `type` annotation may lead to an unexpected increase in the evaluated codebase.
- 1bf5c5b8: The cache has been improved, which should address the build time issues for Webpack 4/5 and resolve HMR-related problems for Vite. Fixes #1199, #1265 and maybe some more.

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

- 890b4aca: Sometimes Babel doesn't mark removed nodes as removed. An additional check was added. Fixes #1262
- 05ad266c: Improved compatibility with redux and some other libraries.
- af5bb92d: The end of support for Node.js 14. Migration to pnpm 8.
- Updated dependencies [16c057df]
- Updated dependencies [af5bb92d]
  - @linaria/logger@4.5.0

## 4.3.4

### Patch Changes

- 54ab61b2: Enhance @linaria/shaker strategy: better search in namespace imports, add support for side effect imports, fix file skipping.

## 4.3.3

### Patch Changes

- dbe250b5: Fix module function deletion when containing restricted code (fixes #1226)

## 4.3.2

### Patch Changes

- f9df4ed8: Address the problem in which a module may be erroneously evaluated as an empty object (fixes #1209)

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
