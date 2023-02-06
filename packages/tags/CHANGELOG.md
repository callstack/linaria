# @linaria/tags

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
