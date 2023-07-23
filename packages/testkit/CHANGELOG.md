# Change Log

## 4.5.3

### Patch Changes

- 79557248: Nothing has changed. Just moved some utils and types from babel to utils package.
- b191f543: New option `features` for fine-tuning the build and evaluation process.
- e59bf809: Shaker mistakenly counts references in types as valuable and keeps referenced variables alive.
- 520ba8da: Debug mode for CLI, Webpack 5 and Vite. When enabled, prints brief perf report to console and information about processed dependency tree to the specified file.
- ae3727f9: Fix the issues with processing files that are supposed to be parsed with their respective Babel config.
- Updated dependencies [79557248]
- Updated dependencies [b191f543]
- Updated dependencies [e59bf809]
- Updated dependencies [520ba8da]
- Updated dependencies [ae3727f9]
  - @linaria/babel-preset@4.5.3
  - @linaria/react@4.5.3
  - @linaria/tags@4.5.3
  - @linaria/shaker@4.5.2

## 4.5.2

### Patch Changes

- 85e74df6: Fix: type imports without `type` annotation may lead to an unexpected increase in the evaluated codebase.
- 1bf5c5b8: The cache has been improved, which should address the build time issues for Webpack 4/5 and resolve HMR-related problems for Vite. Fixes #1199, #1265 and maybe some more.
- Updated dependencies [85e74df6]
- Updated dependencies [1bf5c5b8]
  - @linaria/shaker@4.5.1
  - @linaria/babel-preset@4.5.2
  - @linaria/react@4.5.2
  - @linaria/tags@4.5.2

## 4.5.1

### Patch Changes

- ceca1611: Enable optimisation from #1276 for complex expressions such as `styled(Component as unknow)` or `styled(connect(Component))`.
- 13258306: Variables in props-based interpolation functions are no longer required for the evaluation stage.
  Here's an example:

  ```
  import { getColor } from "very-big-library";

  export const Box = styled.div\`
    color: ${props => getColor(props.kind)};
  \`;
  ```

  In versions prior to and including 4.5.0, the evaluator would attempt to import `getColor` from `very-big-library`, despite it having no relevance to style generation. However, in versions greater than 4.5.0, `very-big-library` will be ignored.

- Updated dependencies [ceca1611]
- Updated dependencies [13258306]
  - @linaria/babel-preset@4.5.1
  - @linaria/react@4.5.1
  - @linaria/tags@4.5.1

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
  - @linaria/tags@4.5.0
  - @linaria/extractor@4.5.0

## 4.3.6

### Patch Changes

- Updated dependencies [821a6819]
- Updated dependencies [54ab61b2]
  - @linaria/babel-preset@4.4.5
  - @linaria/react@4.3.8
  - @linaria/shaker@4.2.11
  - @linaria/tags@4.3.5

## 4.3.5

### Patch Changes

- 1c3f309d: Fix tags usage validation (fixes #1224)
- dbe250b5: Fix module function deletion when containing restricted code (fixes #1226)
- Updated dependencies [2e966f23]
- Updated dependencies [1c3f309d]
- Updated dependencies [dbe250b5]
- Updated dependencies [34029088]
- Updated dependencies [a62e7ba6]
  - @linaria/tags@4.3.4
  - @linaria/babel-preset@4.4.4
  - @linaria/react@4.3.7
  - @linaria/shaker@4.2.10

## 4.3.4

### Patch Changes

- a3ad617f: Fix "Invalid usage of `styled` tag" when it's not really invalid. Fixes #1214.
- Updated dependencies [a3ad617f]
  - @linaria/react@4.3.6
  - @linaria/tags@4.3.3
  - @linaria/babel-preset@4.4.3

## 4.3.3

### Patch Changes

- f9df4ed8: Address the problem in which a module may be erroneously evaluated as an empty object (fixes #1209)
- Updated dependencies [f9df4ed8]
  - @linaria/babel-preset@4.4.2
  - @linaria/react@4.3.5
  - @linaria/shaker@4.2.9
  - @linaria/tags@4.3.2

## 4.3.2

### Patch Changes

- Updated dependencies [917db446]
- Updated dependencies [57c0dc4f]
  - @linaria/babel-preset@4.4.1

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
