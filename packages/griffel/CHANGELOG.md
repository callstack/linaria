# @linaria/griffel

## 4.0.0

### Patch Changes

- 4cdf0315: Tagged template-specific logic has been moved from `BaseProcessor` to `TaggedTemplateProcessor`. `BaseProcessor` now can be used to define any type of expressions for zero-runtime transformations, such as `makeStyles` from `@griffel/react`.
- Updated dependencies [f0cddda4]
  - @linaria/logger@4.0.0
  - @linaria/utils@4.0.0
  - @linaria/tags@4.0.0
