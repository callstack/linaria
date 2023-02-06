# @linaria/testkit

## 4.3.1

### Patch Changes

- 860b8d21: Ensure that the Proxy for this.#exports forwards unknown properties to the underlying Object instance.
- 28f3f93d: Add the tagSource property for processors, indicating the package and name of the imported processor.
- 71a5b351: Workaround for weirdly packaged cjs modules.
- 2d3a741f: fix: handle .cjs & .mjs extensions
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
  - @linaria/tags@4.3.1
  - @linaria/react@4.3.4

## 4.3.0

### Minor Changes

- d11174d0: Add option to remove var() wrapper around css variables

### Patch Changes

- Updated dependencies [3ce985e0]
- Updated dependencies [d11174d0]
  - @linaria/babel-preset@4.3.3
  - @linaria/tags@4.3.0
  - @linaria/react@4.3.3
  - @linaria/shaker@4.2.7

## 4.2.2

### Patch Changes

- 315f0366: Support for code transpiled with esbuild.
- Updated dependencies [315f0366]
  - @linaria/babel-preset@4.3.2
  - @linaria/react@4.3.2
  - @linaria/shaker@4.2.6
  - @linaria/tags@4.2.2

## 4.2.1

### Patch Changes

- e2224348: Fix @linaria/shaker from removing exported renamed imports. Fixes #1114.
- 5edde648: Upgrade Babel to support TypeScript 4.9. Fixes #1133.
- b9e49b74: Support for code transpiled with SWC.
- Updated dependencies [e2224348]
- Updated dependencies [922f20d6]
- Updated dependencies [5edde648]
- Updated dependencies [b9e49b74]
  - @linaria/shaker@4.2.5
  - @linaria/react@4.3.1
  - @linaria/babel-preset@4.3.1
  - @linaria/tags@4.2.1

## 4.2.0

### Minor Changes

- 63f56d47: Do not filter properties if an unknown component is passed to `styled`. Fixes support of custom elements #968

### Patch Changes

- 963508a2: Shaker shouldn't remove parameters of functions if they aren't used.
- Updated dependencies [63f56d47]
- Updated dependencies [963508a2]
- Updated dependencies [c26d4667]
  - @linaria/babel-preset@4.3.0
  - @linaria/react@4.3.0
  - @linaria/tags@4.2.0
  - @linaria/shaker@4.2.4

## 4.1.7

### Patch Changes

- cc2f87a8: Get rid of "expected node to be of a type" errors
- Updated dependencies [cc2f87a8]
- Updated dependencies [6de22792]
  - @linaria/babel-preset@4.2.4
  - @linaria/shaker@4.2.3
  - @linaria/react@4.2.1
  - @linaria/tags@4.1.5

## 4.1.6

### Patch Changes

- Updated dependencies [1e88e95d]
- Updated dependencies [9111b4ea]
  - @linaria/react@4.2.0
  - @linaria/babel-preset@4.2.3

## 4.1.5

### Patch Changes

- c2092f61: Support for rollup@3 and vite@3 (fixes #1044, #1060)
- 08304e09: Fix support of re-exports compiled by tsc
- 87ffe61c: The new `variableNameSlug` option that allows to customize css variable names (closes #1053).
- Updated dependencies [8a8be242]
- Updated dependencies [8a8be242]
- Updated dependencies [c2092f61]
- Updated dependencies [08304e09]
- Updated dependencies [87ffe61c]
  - @linaria/shaker@4.2.2
  - @linaria/babel-preset@4.2.2
  - @linaria/react@4.1.5
  - @linaria/tags@4.1.4

## 4.1.4

### Patch Changes

- Updated dependencies [24b4a4bd]
  - @linaria/babel-preset@4.2.1
  - @linaria/shaker@4.2.1
  - @linaria/tags@4.1.3
  - @linaria/react@4.1.4

## 4.1.3

### Patch Changes

- ac0991a6: Better detection for jsx-runtime. Reduces the amount of evaluated code and improves speed and stability.
- Updated dependencies [8590e134]
- Updated dependencies [f7351b09]
- Updated dependencies [c0bd271a]
- Updated dependencies [8f90fa75]
- Updated dependencies [a5169f16]
- Updated dependencies [ac0991a6]
  - @linaria/babel-preset@4.2.0
  - @linaria/shaker@4.2.0
  - @linaria/react@4.1.3
  - @linaria/tags@4.1.2

## 4.1.2

### Patch Changes

- Updated dependencies [3c593aa8]
  - @linaria/babel-preset@4.1.2
  - @linaria/shaker@4.1.2
  - @linaria/tags@4.1.1
  - @linaria/react@4.1.2

## 4.1.1

### Patch Changes

- 21ba7a44: The default config was changed to process ES modules inside node_modules.
- 21ba7a44: The better detector of React components.
- Updated dependencies [21ba7a44]
- Updated dependencies [21ba7a44]
- Updated dependencies [21ba7a44]
- Updated dependencies [2abc55b3]
- Updated dependencies [21ba7a44]
  - @linaria/babel-preset@4.1.1
  - @linaria/react@4.1.1
  - @linaria/shaker@4.1.1

## 4.1.0

### Minor Changes

- 92f6d871: Instead of just replacing tags with their runtime versions, `transform` mistakenly applied all babel transformations. (fixes #1018)

### Patch Changes

- Updated dependencies [92f6d871]
  - @linaria/babel-preset@4.1.0
  - @linaria/shaker@4.1.0
  - @linaria/tags@4.1.0
  - @linaria/react@4.1.0

## 4.0.0

### Major Changes

- bc0cbeea: A completely new async mode with native support for Vite, Rollup, esbuild and Webpack resolvers.

  BREAKING CHANGES: Despite the fact, that it should be fully compatible with 3.0 and 2.0 branches, the new version of styles evaluator can have some serious bugs which can make your project unbuildable (however, since there is no runtime, if the build is finished successfully, everything will continue work as it was on 2.0 and 3.0). If you face some problems please let us know and we will fix it as soon as possible.

### Patch Changes

- 8be5650d: The repo has been migrated to PNPM and Turborepo
- 17c83e34: Fix for the case when `styled` wraps an imported component.
- ea41d440: New package @linaria/tags that contains all abstract logic for tags processors.
- 592b89b5: Fix for broken object interpolation (#995)
- 9a50c1c1: Linaria now removes all unused css-related code from the runtime.
- 4cdf0315: Tagged template-specific logic has been moved from `BaseProcessor` to `TaggedTemplateProcessor`. `BaseProcessor` now can be used to define any type of expressions for zero-runtime transformations, such as `makeStyles` from `@griffel/react`.
- 17c83e34: Aliases for environments without the support of `exports` in package.json.
- f0cddda4: Extends `BaseProcessor` to support tags other than tagged templates, such as `makeStyles` from `@griffel/react`.
- Updated dependencies [f0cddda4]
  - @linaria/babel-preset@4.0.0
  - @linaria/extractor@4.0.0
  - @linaria/react@4.0.0
  - @linaria/shaker@4.0.0
  - @linaria/tags@4.0.0

## 3.0.0-beta.21

### Patch Changes

- 17c83e34: Aliases for environments without the support of `exports` in package.json.
- Updated dependencies [17c83e34]
  - @linaria/react@3.0.0-beta.21
  - @linaria/babel-preset@3.0.0-beta.21
  - @linaria/extractor@3.0.0-beta.21
  - @linaria/preeval@3.0.0-beta.21
  - @linaria/shaker@3.0.0-beta.21

## 3.0.0-beta.20

### Patch Changes

- 8be5650d: The repo has been migrated to PNPM and Turborepo
- Updated dependencies
  - @linaria/babel-preset@3.0.0-beta.20
  - @linaria/extractor@3.0.0-beta.20
  - @linaria/preeval@3.0.0-beta.20
  - @linaria/react@3.0.0-beta.20
  - @linaria/shaker@3.0.0-beta.20
