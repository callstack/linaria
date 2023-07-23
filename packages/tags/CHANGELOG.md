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
  - @linaria/utils@4.5.2

## 4.5.2

### Patch Changes

- Updated dependencies [85e74df6]
- Updated dependencies [1bf5c5b8]
  - @linaria/utils@4.5.1

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
  - @linaria/logger@4.5.0

## 4.3.5

### Patch Changes

- 54ab61b2: Enhance @linaria/shaker strategy: better search in namespace imports, add support for side effect imports, fix file skipping.
- Updated dependencies [54ab61b2]
  - @linaria/utils@4.3.4

## 4.3.4

### Patch Changes

- 2e966f23: Fix TypeScript < 4.7 compatibility (fixes #1227)
- 1c3f309d: Fix tags usage validation (fixes #1224)
- Updated dependencies [dbe250b5]
  - @linaria/utils@4.3.3

## 4.3.3

### Patch Changes

- a3ad617f: Fix "Invalid usage of `styled` tag" when it's not really invalid. Fixes #1214.

## 4.3.2

### Patch Changes

- Updated dependencies [f9df4ed8]
  - @linaria/utils@4.3.2

## 4.3.1

### Patch Changes

- 28f3f93d: Add the tagSource property for processors, indicating the package and name of the imported processor.
- Updated dependencies [71a5b351]
- Updated dependencies [61d49a39]
  - @linaria/utils@4.3.1

## 4.3.0

### Minor Changes

- d11174d0: Add option to remove var() wrapper around css variables

### Patch Changes

- 3ce985e0: Update tags processor to insert appropriate import/request for ESM/CommonJS.
- Updated dependencies [3ce985e0]
- Updated dependencies [d11174d0]
  - @linaria/utils@4.3.0

## 4.2.2

### Patch Changes

- Updated dependencies [315f0366]
  - @linaria/utils@4.2.6

## 4.2.1

### Patch Changes

- 5edde648: Upgrade Babel to support TypeScript 4.9. Fixes #1133.
- Updated dependencies [5edde648]
- Updated dependencies [b9e49b74]
  - @linaria/utils@4.2.5

## 4.2.0

### Minor Changes

- 63f56d47: Do not filter properties if an unknown component is passed to `styled`. Fixes support of custom elements #968

### Patch Changes

- Updated dependencies [963508a2]
  - @linaria/utils@4.2.4

## 4.1.5

### Patch Changes

- Updated dependencies [cc2f87a8]
  - @linaria/utils@4.2.3

## 4.1.4

### Patch Changes

- 87ffe61c: The new `variableNameSlug` option that allows to customize css variable names (closes #1053).
- Updated dependencies [8a8be242]
- Updated dependencies [8a8be242]
- Updated dependencies [08304e09]
- Updated dependencies [87ffe61c]
  - @linaria/utils@4.2.2

## 4.1.3

### Patch Changes

- Updated dependencies [24b4a4bd]
  - @linaria/utils@4.2.1

## 4.1.2

### Patch Changes

- c0bd271a: Sometimes Linaria can meet already processed code. In such a case, it shall ignore runtime versions of `styled` tags. Fixes #1037.
- Updated dependencies [8590e134]
- Updated dependencies [f7351b09]
- Updated dependencies [8f90fa75]
- Updated dependencies [ac0991a6]
  - @linaria/utils@4.2.0

## 4.1.1

### Patch Changes

- Updated dependencies [50bc0c79]
  - @linaria/utils@4.1.1

## 4.1.0

### Patch Changes

- Updated dependencies [92f6d871]
  - @linaria/utils@4.1.0

## 4.0.0

### Patch Changes

- ea41d440: New package @linaria/tags that contains all abstract logic for tags processors.
- 4cdf0315: Tagged template-specific logic has been moved from `BaseProcessor` to `TaggedTemplateProcessor`. `BaseProcessor` now can be used to define any type of expressions for zero-runtime transformations, such as `makeStyles` from `@griffel/react`.
- f0cddda4: Extends `BaseProcessor` to support tags other than tagged templates, such as `makeStyles` from `@griffel/react`.
- Updated dependencies [ea41d440]
  - @linaria/logger@4.0.0
  - @linaria/utils@4.0.0
