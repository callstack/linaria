# Change Log

## 4.5.3

### Patch Changes

- 520ba8da: Debug mode for CLI, Webpack 5 and Vite. When enabled, prints brief perf report to console and information about processed dependency tree to the specified file.
- Updated dependencies [79557248]
- Updated dependencies [b191f543]
- Updated dependencies [e59bf809]
- Updated dependencies [520ba8da]
- Updated dependencies [ae3727f9]
- Updated dependencies [dca076ef]
  - @linaria/babel-preset@4.5.3
  - @linaria/utils@4.5.2

## 4.5.2

### Patch Changes

- cceaac99: Fixed Windows support (fix for #1240)
- 1bf5c5b8: The cache has been improved, which should address the build time issues for Webpack 4/5 and resolve HMR-related problems for Vite. Fixes #1199, #1265 and maybe some more.
- Updated dependencies [85e74df6]
- Updated dependencies [1bf5c5b8]
  - @linaria/utils@4.5.1
  - @linaria/babel-preset@4.5.2

## 4.5.1

### Patch Changes

- Updated dependencies [ceca1611]
- Updated dependencies [13258306]
  - @linaria/babel-preset@4.5.1

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
- a6a29da7: Fix vite css `url()` resolve error
- Updated dependencies [890b4aca]
- Updated dependencies [418e40af]
- Updated dependencies [05ad266c]
- Updated dependencies [16c057df]
- Updated dependencies [af5bb92d]
  - @linaria/utils@4.5.0
  - @linaria/babel-preset@4.5.0
  - @linaria/logger@4.5.0

## 4.2.11

### Patch Changes

- Updated dependencies [821a6819]
- Updated dependencies [54ab61b2]
  - @linaria/babel-preset@4.4.5
  - @linaria/utils@4.3.4

## 4.2.10

### Patch Changes

- Updated dependencies [1c3f309d]
- Updated dependencies [dbe250b5]
- Updated dependencies [a62e7ba6]
  - @linaria/babel-preset@4.4.4
  - @linaria/utils@4.3.3

## 4.2.9

### Patch Changes

- @linaria/babel-preset@4.4.3

## 4.2.8

### Patch Changes

- 13f0b416: Fallback resolver for external libraries when bundling with Rollup or Vite.
- Updated dependencies [f9df4ed8]
  - @linaria/babel-preset@4.4.2
  - @linaria/utils@4.3.2

## 4.2.7

### Patch Changes

- 917db446: A workaround for an issue with Vite and imports from some third-party libs.
- Updated dependencies [917db446]
- Updated dependencies [57c0dc4f]
  - @linaria/babel-preset@4.4.1

## 4.2.6

### Patch Changes

- ed20e6c7: Normalize import path in the Vite plugin to fix Vite builds on Windows
- Updated dependencies [9cf41fae]
- Updated dependencies [860b8d21]
- Updated dependencies [af783273]
- Updated dependencies [28f3f93d]
- Updated dependencies [1d4d6833]
- Updated dependencies [71a5b351]
- Updated dependencies [2d3a741f]
- Updated dependencies [61d49a39]
  - @linaria/babel-preset@4.4.0
  - @linaria/utils@4.3.1

## 4.2.5

### Patch Changes

- 7c309666: Add support for Vite 4
- 017deab7: Vite should replace import aliases so resolve functions in bundlers should be able to correctly resolve imports.
- Updated dependencies [3ce985e0]
- Updated dependencies [d11174d0]
  - @linaria/babel-preset@4.3.3
  - @linaria/utils@4.3.0

## 4.2.4

### Patch Changes

- b874f299: Fixes the SSR support for Vite. Fixes #1105.
- Updated dependencies [315f0366]
  - @linaria/utils@4.2.6
  - @linaria/babel-preset@4.3.2

## 4.2.3

### Patch Changes

- 655c4f2c: Add Vite plugin with HMR support.
- Updated dependencies [5edde648]
- Updated dependencies [b9e49b74]
  - @linaria/babel-preset@4.3.1
  - @linaria/utils@4.2.5
