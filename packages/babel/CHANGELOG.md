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
- Updated dependencies [dca076ef]
  - @linaria/core@4.5.3
  - @linaria/tags@4.5.3
  - @linaria/utils@4.5.2
  - @linaria/shaker@4.5.2

## 4.5.2

### Patch Changes

- 1bf5c5b8: The cache has been improved, which should address the build time issues for Webpack 4/5 and resolve HMR-related problems for Vite. Fixes #1199, #1265 and maybe some more.
- Updated dependencies [85e74df6]
- Updated dependencies [1bf5c5b8]
  - @linaria/shaker@4.5.1
  - @linaria/utils@4.5.1
  - @linaria/core@4.5.2
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

- 418e40af: Support for .cts/.mts files
- af5bb92d: The end of support for Node.js 14. Migration to pnpm 8.
- Updated dependencies [890b4aca]
- Updated dependencies [05ad266c]
- Updated dependencies [16c057df]
- Updated dependencies [af5bb92d]
  - @linaria/utils@4.5.0
  - @linaria/shaker@4.5.0
  - @linaria/tags@4.5.0
  - @linaria/core@4.5.0
  - @linaria/logger@4.5.0

## 4.4.5

### Patch Changes

- 821a6819: Better support for ES-modules in node_modules (fixes #1242)
- Updated dependencies [54ab61b2]
  - @linaria/shaker@4.2.11
  - @linaria/tags@4.3.5
  - @linaria/utils@4.3.4
  - @linaria/core@4.2.10

## 4.4.4

### Patch Changes

- 1c3f309d: Fix tags usage validation (fixes #1224)
- dbe250b5: Fix module function deletion when containing restricted code (fixes #1226)
- a62e7ba6: Avoid parsing json as js
- Updated dependencies [2e966f23]
- Updated dependencies [1c3f309d]
- Updated dependencies [dbe250b5]
- Updated dependencies [34029088]
  - @linaria/tags@4.3.4
  - @linaria/shaker@4.2.10
  - @linaria/utils@4.3.3
  - @linaria/core@4.2.9

## 4.4.3

### Patch Changes

- Updated dependencies [a3ad617f]
  - @linaria/tags@4.3.3
  - @linaria/core@4.2.8

## 4.4.2

### Patch Changes

- f9df4ed8: Address the problem in which a module may be erroneously evaluated as an empty object (fixes #1209)
- Updated dependencies [f9df4ed8]
  - @linaria/utils@4.3.2
  - @linaria/core@4.2.7
  - @linaria/shaker@4.2.9
  - @linaria/tags@4.3.2

## 4.4.1

### Patch Changes

- 917db446: A workaround for an issue with Vite and imports from some third-party libs.
- 57c0dc4f: Another fix for infinite loops. Fixes #1202

## 4.4.0

### Minor Changes

- af783273: Fix circular dependencies-related errors and freezes (fixes #1193)

### Patch Changes

- 9cf41fae: chore: remove custom typings for @babel/helper-module-imports
- 860b8d21: Ensure that the Proxy for this.#exports forwards unknown properties to the underlying Object instance.
- 28f3f93d: Add the tagSource property for processors, indicating the package and name of the imported processor.
- 1d4d6833: fix(babel): update cosmiconfig so linaria.config.cjs works
- 2d3a741f: fix: handle .cjs & .mjs extensions
- 61d49a39: Fix for #1112 "Cannot read properties of undefined (reading 'localeCompare')"
- Updated dependencies [b27f328f]
- Updated dependencies [28f3f93d]
- Updated dependencies [71a5b351]
- Updated dependencies [cf1d6611]
- Updated dependencies [61d49a39]
  - @linaria/shaker@4.2.8
  - @linaria/tags@4.3.1
  - @linaria/utils@4.3.1
  - @linaria/core@4.2.6

## 4.3.3

### Patch Changes

- 3ce985e0: Update tags processor to insert appropriate import/request for ESM/CommonJS.
- Updated dependencies [3ce985e0]
- Updated dependencies [d11174d0]
  - @linaria/tags@4.3.0
  - @linaria/utils@4.3.0
  - @linaria/core@4.2.5
  - @linaria/shaker@4.2.7

## 4.3.2

### Patch Changes

- 315f0366: Support for code transpiled with esbuild.
- Updated dependencies [315f0366]
  - @linaria/utils@4.2.6
  - @linaria/core@4.2.4
  - @linaria/shaker@4.2.6
  - @linaria/tags@4.2.2

## 4.3.1

### Patch Changes

- 5edde648: Upgrade Babel to support TypeScript 4.9. Fixes #1133.
- b9e49b74: Support for code transpiled with SWC.
- Updated dependencies [e2224348]
- Updated dependencies [5edde648]
- Updated dependencies [b9e49b74]
  - @linaria/shaker@4.2.5
  - @linaria/core@4.2.3
  - @linaria/tags@4.2.1
  - @linaria/utils@4.2.5

## 4.3.0

### Minor Changes

- 63f56d47: Do not filter properties if an unknown component is passed to `styled`. Fixes support of custom elements #968

### Patch Changes

- Updated dependencies [63f56d47]
- Updated dependencies [963508a2]
  - @linaria/tags@4.2.0
  - @linaria/shaker@4.2.4
  - @linaria/utils@4.2.4
  - @linaria/core@4.2.2

## 4.2.4

### Patch Changes

- cc2f87a8: Get rid of "expected node to be of a type" errors
- Updated dependencies [cc2f87a8]
  - @linaria/utils@4.2.3
  - @linaria/shaker@4.2.3
  - @linaria/core@4.2.1
  - @linaria/tags@4.1.5

## 4.2.3

### Patch Changes

- 9111b4ea: Fix an issue with async resolvers that sometimes leads to attempts to evaluate unprepared code. Fixes #1054.
- Updated dependencies [1e88e95d]
  - @linaria/core@4.2.0

## 4.2.2

### Patch Changes

- c2092f61: Support for rollup@3 and vite@3 (fixes #1044, #1060)
- 08304e09: Fix support of re-exports compiled by tsc
- Updated dependencies [8a8be242]
- Updated dependencies [8a8be242]
- Updated dependencies [08304e09]
- Updated dependencies [87ffe61c]
  - @linaria/shaker@4.2.2
  - @linaria/utils@4.2.2
  - @linaria/core@4.1.4
  - @linaria/tags@4.1.4

## 4.2.1

### Patch Changes

- 24b4a4bd: Fix function usage in string literals. Fixes #1047.
- Updated dependencies [24b4a4bd]
  - @linaria/shaker@4.2.1
  - @linaria/utils@4.2.1
  - @linaria/core@4.1.3
  - @linaria/tags@4.1.3

## 4.2.0

### Minor Changes

- f7351b09: In some cases, different parts of babel-preset could use different versions of installed @babel/core. It caused the ".key is not a valid Plugin property" error. Fixed.

### Patch Changes

- 8590e134: Fix for incorrect shaker behaviour when it tries to keep a function declaration with a removed body (fixes #1036).
- c0bd271a: Sometimes Linaria can meet already processed code. In such a case, it shall ignore runtime versions of `styled` tags. Fixes #1037.
- 8f90fa75: If an expression in a string literal is deleted during preeval stage, it should be replaced with an empty string. Fixes #1039.
- a5169f16: Do not set custom babel envName for the shaker. Fixes #1034.
- ac0991a6: Better detection for jsx-runtime. Reduces the amount of evaluated code and improves speed and stability.
- Updated dependencies [8590e134]
- Updated dependencies [f7351b09]
- Updated dependencies [c0bd271a]
- Updated dependencies [8f90fa75]
- Updated dependencies [a5169f16]
- Updated dependencies [ac0991a6]
  - @linaria/utils@4.2.0
  - @linaria/shaker@4.2.0
  - @linaria/tags@4.1.2
  - @linaria/core@4.1.2

## 4.1.2

### Patch Changes

- 3c593aa8: React hooks aren't needed for evaluation so we can replace them as we already do with react components (fixes compatability with [ariakit](https://github.com/ariakit/ariakit) and some other libraries).
- Updated dependencies [50bc0c79]
  - @linaria/utils@4.1.1
  - @linaria/core@4.1.1
  - @linaria/shaker@4.1.2
  - @linaria/tags@4.1.1

## 4.1.1

### Patch Changes

- 21ba7a44: Circuit breaker for cyclic dependencies.
- 21ba7a44: The default config was changed to process ES modules inside node_modules.
- 21ba7a44: In some cases, Linaria threw an error that the imported value is undefined.
- 2abc55b3: Fix 'Using the tag in runtime is not supported' in some enviroments (fixes #1021)
- 21ba7a44: The better detector of React components.
- Updated dependencies [2abc55b3]
  - @linaria/shaker@4.1.1

## 4.1.0

### Minor Changes

- 92f6d871: Instead of just replacing tags with their runtime versions, `transform` mistakenly applied all babel transformations. (fixes #1018)

### Patch Changes

- 92f6d871: Shaker tried to keep alive object methods even if their body was removed (fixes #1018)
- Updated dependencies [92f6d871]
  - @linaria/utils@4.1.0
  - @linaria/core@4.1.0
  - @linaria/shaker@4.1.0
  - @linaria/tags@4.1.0

## 4.0.0

### Major Changes

- bc0cbeea: A completely new async mode with native support for Vite, Rollup, esbuild and Webpack resolvers.

  BREAKING CHANGES: Despite the fact, that it should be fully compatible with 3.0 and 2.0 branches, the new version of styles evaluator can have some serious bugs which can make your project unbuildable (however, since there is no runtime, if the build is finished successfully, everything will continue work as it was on 2.0 and 3.0). If you face some problems please let us know and we will fix it as soon as possible.

### Patch Changes

- 8be5650d: The repo has been migrated to PNPM and Turborepo
- 17c83e34: Fix for the case when `styled` wraps an imported component.
- ea41d440: New package @linaria/tags that contains all abstract logic for tags processors.
- 592b89b5: Fix for broken object interpolation (#995)
- bc0cbeea: Brought back `libResolver` under the new name `tagResolver`
- 9a50c1c1: Linaria now removes all unused css-related code from the runtime.
- 4cdf0315: Tagged template-specific logic has been moved from `BaseProcessor` to `TaggedTemplateProcessor`. `BaseProcessor` now can be used to define any type of expressions for zero-runtime transformations, such as `makeStyles` from `@griffel/react`.
- 782deb6f: Pass source-root option from CLI to babel-preset
- 17c83e34: Aliases for environments without the support of `exports` in package.json.
- f0cddda4: Extends `BaseProcessor` to support tags other than tagged templates, such as `makeStyles` from `@griffel/react`.
- Updated dependencies [f0cddda4]
  - @linaria/core@4.0.0
  - @linaria/logger@4.0.0
  - @linaria/shaker@4.0.0
  - @linaria/utils@4.0.0
  - @linaria/tags@4.0.0

## 3.0.0-beta.21

### Patch Changes

- 17c83e34: Fix for the case when `styled` wraps an imported component.
- Updated dependencies [17c83e34]
  - @linaria/core@3.0.0-beta.21

## 3.0.0-beta.20

### Patch Changes

- 8be5650d: The repo has been migrated to PNPM and Turborepo
- Updated dependencies [8be5650d]
  - @linaria/core@3.0.0-beta.20
  - @linaria/logger@3.0.0-beta.20
  - @linaria/utils@3.0.0-beta.20

# [3.0.0-beta.19](https://github.com/callstack/linaria/compare/v3.0.0-beta.18...v3.0.0-beta.19) (2022-06-03)

### Bug Fixes

- **atomic:** fix duplication of the same css properties in the same file ([#972](https://github.com/callstack/linaria/issues/972)) ([f60039e](https://github.com/callstack/linaria/commit/f60039e9145627456d18cbff6b3610a95f1e7219))
- **babel:** error when css calls reference css calls inside components ([#971](https://github.com/callstack/linaria/issues/971)) ([fe6e083](https://github.com/callstack/linaria/commit/fe6e083fb48e71274a4e506824ccb8b461b7fb89))

### Features

- **atomic:** add support for atomic using styled API ([#966](https://github.com/callstack/linaria/issues/966)) ([f59860b](https://github.com/callstack/linaria/commit/f59860b09c5f91b0423dbf188e5f8aaaef38a6b5))
- **babel:** api for custom tags ([#976](https://github.com/callstack/linaria/issues/976)) ([3285ccc](https://github.com/callstack/linaria/commit/3285ccc1d00449b78b3fc74087528cd38cbdd116))
- **babel:** new way for detecting tag imports ([#974](https://github.com/callstack/linaria/issues/974)) ([3305cfb](https://github.com/callstack/linaria/commit/3305cfb0c0f65abdacceeb7e6bad118c59f7d551))
- **core:** allow renaming of css template literals ([#973](https://github.com/callstack/linaria/issues/973)) ([8f59a82](https://github.com/callstack/linaria/commit/8f59a82400143ef35b6ffc7f024ad5e6a16552d8))

# [3.0.0-beta.18](https://github.com/callstack/linaria/compare/v3.0.0-beta.17...v3.0.0-beta.18) (2022-04-01)

### Bug Fixes

- **shaker:** fix edge case with polyfilled defineProperty ([#951](https://github.com/callstack/linaria/issues/951)) ([38a5541](https://github.com/callstack/linaria/commit/38a5541d26142cafa859ceffa6922ef559c57100))
- **shaker:** fix some edge cases related to export patterns ([#951](https://github.com/callstack/linaria/issues/951)) ([18ca481](https://github.com/callstack/linaria/commit/18ca481f1f85ebcdc2704cc4af2173dcf9a4bb7f))

### Features

- **atomic:** add property priorities ([#950](https://github.com/callstack/linaria/issues/950)) ([c44becb](https://github.com/callstack/linaria/commit/c44becb11b2eec795b68c2b3d0715672ba4b3888))
- **atomic:** add support for at-rules, keyframes and pseudo classes ([#913](https://github.com/callstack/linaria/issues/913)) ([dee7fa1](https://github.com/callstack/linaria/commit/dee7fa14ea912224cac9f0673be7464e93571a73))
- **atomic:** string serialization of atoms ([#934](https://github.com/callstack/linaria/issues/934)) ([ef19ccb](https://github.com/callstack/linaria/commit/ef19ccb384cb7dbee561e789f637b0289d4d224c))

# [3.0.0-beta.17](https://github.com/callstack/linaria/compare/v3.0.0-beta.16...v3.0.0-beta.17) (2021-12-27)

### Bug Fixes

- **react:** refactored types for styled function (fixes [#872](https://github.com/callstack/linaria/issues/872)) ([#887](https://github.com/callstack/linaria/issues/887)) ([7b8b129](https://github.com/callstack/linaria/commit/7b8b12937f9a0d1730d908e7cebad1684ccb03c3))

### Features

- **resolver:** add custom resolver option to support re-exporting of linaria libs ([#882](https://github.com/callstack/linaria/issues/882)) ([ad4a368](https://github.com/callstack/linaria/commit/ad4a36857faceec19fa083b28d43af01d5f48f11))

# [3.0.0-beta.15](https://github.com/callstack/linaria/compare/v3.0.0-beta.14...v3.0.0-beta.15) (2021-11-29)

### Bug Fixes

- **babel:** missed reference to atomic ([079379e](https://github.com/callstack/linaria/commit/079379ec7adf713c830da345955b6e5d8c968d6b))

### Features

- **atomic:** create an atomic package for the css API ([#867](https://github.com/callstack/linaria/issues/867)) ([4773bcf](https://github.com/callstack/linaria/commit/4773bcf4b14f08cdc4d2b612654b962cdfc97eaa))

# [3.0.0-beta.14](https://github.com/callstack/linaria/compare/v3.0.0-beta.13...v3.0.0-beta.14) (2021-11-05)

### Bug Fixes

- **shaker:** exports/object issue with TS (fixes [#861](https://github.com/callstack/linaria/issues/861)) ([#863](https://github.com/callstack/linaria/issues/863)) ([acdbdfe](https://github.com/callstack/linaria/commit/acdbdfe5be46eee238f83eb41aeb2291b5d9e034))
- **shaker:** reimplement enums support (fixes [#848](https://github.com/callstack/linaria/issues/848)) ([#853](https://github.com/callstack/linaria/issues/853)) ([8f1d7cb](https://github.com/callstack/linaria/commit/8f1d7cbadb2665fd734bcda42fd1caa6042659f4))

# [3.0.0-beta.13](https://github.com/callstack/linaria/compare/v3.0.0-beta.12...v3.0.0-beta.13) (2021-09-13)

### Bug Fixes

- **shaker:** partial support for ts compiled code (fixes [#820](https://github.com/callstack/linaria/issues/820)) ([#836](https://github.com/callstack/linaria/issues/836)) ([ec8ee68](https://github.com/callstack/linaria/commit/ec8ee684b6e90ead46295733ccd8cfefe4eaa04d))

# [3.0.0-beta.12](https://github.com/callstack/linaria/compare/v3.0.0-beta.11...v3.0.0-beta.12) (2021-08-31)

### Bug Fixes

- **shaker:** improve dependency resolution for wildcard exports ([#826](https://github.com/callstack/linaria/issues/826), fixes [#816](https://github.com/callstack/linaria/issues/816)) ([5aac3eb](https://github.com/callstack/linaria/commit/5aac3eb86ec10e1a6ae60097482155fe44498c28))

### Features

- **babel:** add file, name, dir, ext to classNameSlug ([#825](https://github.com/callstack/linaria/issues/825), fixes [#650](https://github.com/callstack/linaria/issues/650) and [#571](https://github.com/callstack/linaria/issues/571)) ([c1fdb7c](https://github.com/callstack/linaria/commit/c1fdb7c62b407c20b154ea721dc37919258f7ff5))
- make @linaria/shaker optional ([#819](https://github.com/callstack/linaria/issues/819)) ([2a55b03](https://github.com/callstack/linaria/commit/2a55b0399d49d6aee2a436084aea5423675c1722))

# [3.0.0-beta.7](https://github.com/callstack/linaria/compare/v3.0.0-beta.6...v3.0.0-beta.7) (2021-06-24)

### Bug Fixes

- **shaker:** fix undefined imports in some cases ([#333](https://github.com/callstack/linaria/issues/333), [#761](https://github.com/callstack/linaria/issues/761)) ([#787](https://github.com/callstack/linaria/issues/787)) ([e374072](https://github.com/callstack/linaria/commit/e3740727447b2867a2cfe40f763bc88e72eb2503))

# [3.0.0-beta.5](https://github.com/callstack/linaria/compare/v3.0.0-beta.4...v3.0.0-beta.5) (2021-05-31)

### Bug Fixes

- **shaker:** typescript enums support ([#761](https://github.com/callstack/linaria/issues/761)) ([#764](https://github.com/callstack/linaria/issues/764)) ([6907e22](https://github.com/callstack/linaria/commit/6907e2280a2ab8ee014b5d02b1169714ccac9d66))

# [3.0.0-beta.4](https://github.com/callstack/linaria/compare/v3.0.0-beta.3...v3.0.0-beta.4) (2021-05-07)

**Note:** Version bump only for package @linaria/babel-preset

# [3.0.0-beta.3](https://github.com/callstack/linaria/compare/v3.0.0-beta.2...v3.0.0-beta.3) (2021-04-20)

**Note:** Version bump only for package @linaria/babel-preset

# [3.0.0-beta.2](https://github.com/callstack/linaria/compare/v3.0.0-beta.1...v3.0.0-beta.2) (2021-04-11)

### Bug Fixes

- Import custom identifier called css with error "Cannot find module 'linaria'" [#739](https://github.com/callstack/linaria/issues/739) ([#740](https://github.com/callstack/linaria/issues/740)) ([07fb381](https://github.com/callstack/linaria/commit/07fb38131c9dec406dcca72f45638561c815e824))
- loadOptions text regex ([#728](https://github.com/callstack/linaria/issues/728)) ([34ca3e5](https://github.com/callstack/linaria/commit/34ca3e5f211b65c14c2bf4efabb7065f7109da23))

### Features

- **babel:** expose CSS extraction from AST logic ([#737](https://github.com/callstack/linaria/issues/737)) ([f049a11](https://github.com/callstack/linaria/commit/f049a119ef70346340676ab6a397ad6358e5f39b))
