# Change Log

## 4.5.3

### Patch Changes

- e59bf809: Shaker mistakenly counts references in types as valuable and keeps referenced variables alive.
- Updated dependencies [79557248]
- Updated dependencies [b191f543]
- Updated dependencies [e59bf809]
- Updated dependencies [520ba8da]
- Updated dependencies [ae3727f9]
- Updated dependencies [dca076ef]
  - @linaria/tags@4.5.3
  - @linaria/utils@4.5.2

## 4.5.2

### Patch Changes

- Updated dependencies [85e74df6]
- Updated dependencies [1bf5c5b8]
  - @linaria/utils@4.5.1
  - @linaria/tags@4.5.2

## 4.5.1

### Patch Changes

- Updated dependencies [ceca1611]
- Updated dependencies [13258306]
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
- Updated dependencies [890b4aca]
- Updated dependencies [05ad266c]
- Updated dependencies [16c057df]
- Updated dependencies [af5bb92d]
  - @linaria/utils@4.5.0
  - @linaria/tags@4.5.0
  - @linaria/logger@4.5.0

## 4.2.8

### Patch Changes

- Updated dependencies [54ab61b2]
  - @linaria/tags@4.3.5
  - @linaria/utils@4.3.4

## 4.2.7

### Patch Changes

- 1c3f309d: Fix tags usage validation (fixes #1224)
- Updated dependencies [2e966f23]
- Updated dependencies [1c3f309d]
- Updated dependencies [dbe250b5]
  - @linaria/tags@4.3.4
  - @linaria/utils@4.3.3

## 4.2.6

### Patch Changes

- Updated dependencies [a3ad617f]
  - @linaria/tags@4.3.3

## 4.2.5

### Patch Changes

- Updated dependencies [f9df4ed8]
  - @linaria/utils@4.3.2
  - @linaria/tags@4.3.2

## 4.2.4

### Patch Changes

- Updated dependencies [28f3f93d]
- Updated dependencies [71a5b351]
- Updated dependencies [61d49a39]
  - @linaria/tags@4.3.1
  - @linaria/utils@4.3.1

## 4.2.3

### Patch Changes

- Updated dependencies [3ce985e0]
- Updated dependencies [d11174d0]
  - @linaria/tags@4.3.0
  - @linaria/utils@4.3.0

## 4.2.2

### Patch Changes

- Updated dependencies [315f0366]
  - @linaria/utils@4.2.6
  - @linaria/tags@4.2.2

## 4.2.1

### Patch Changes

- 5edde648: Upgrade Babel to support TypeScript 4.9. Fixes #1133.
- Updated dependencies [5edde648]
- Updated dependencies [b9e49b74]
  - @linaria/tags@4.2.1
  - @linaria/utils@4.2.5

## 4.2.0

### Minor Changes

- 63f56d47: Do not filter properties if an unknown component is passed to `styled`. Fixes support of custom elements #968

### Patch Changes

- Updated dependencies [63f56d47]
- Updated dependencies [963508a2]
  - @linaria/tags@4.2.0
  - @linaria/utils@4.2.4

## 4.1.5

### Patch Changes

- Updated dependencies [cc2f87a8]
  - @linaria/utils@4.2.3
  - @linaria/tags@4.1.5

## 4.1.4

### Patch Changes

- Updated dependencies [8a8be242]
- Updated dependencies [8a8be242]
- Updated dependencies [08304e09]
- Updated dependencies [87ffe61c]
  - @linaria/utils@4.2.2
  - @linaria/tags@4.1.4

## 4.1.3

### Patch Changes

- Updated dependencies [24b4a4bd]
  - @linaria/utils@4.2.1
  - @linaria/tags@4.1.3

## 4.1.2

### Patch Changes

- Updated dependencies [8590e134]
- Updated dependencies [f7351b09]
- Updated dependencies [c0bd271a]
- Updated dependencies [8f90fa75]
- Updated dependencies [ac0991a6]
  - @linaria/utils@4.2.0
  - @linaria/tags@4.1.2

## 4.1.1

### Patch Changes

- Updated dependencies [50bc0c79]
  - @linaria/utils@4.1.1
  - @linaria/tags@4.1.1

## 4.1.0

### Patch Changes

- Updated dependencies [92f6d871]
  - @linaria/utils@4.1.0
  - @linaria/tags@4.1.0

## 4.0.0

### Patch Changes

- 4cdf0315: Tagged template-specific logic has been moved from `BaseProcessor` to `TaggedTemplateProcessor`. `BaseProcessor` now can be used to define any type of expressions for zero-runtime transformations, such as `makeStyles` from `@griffel/react`.
- Updated dependencies [f0cddda4]
  - @linaria/logger@4.0.0
  - @linaria/utils@4.0.0
  - @linaria/tags@4.0.0
