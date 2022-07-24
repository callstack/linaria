# @linaria/tags

## 4.0.0

### Patch Changes

- ea41d440: New package @linaria/tags that contains all abstract logic for tags processors.
- 4cdf0315: Tagged template-specific logic has been moved from `BaseProcessor` to `TaggedTemplateProcessor`. `BaseProcessor` now can be used to define any type of expressions for zero-runtime transformations, such as `makeStyles` from `@griffel/react`.
- f0cddda4: Extends `BaseProcessor` to support tags other than tagged templates, such as `makeStyles` from `@griffel/react`.
- Updated dependencies [ea41d440]
  - @linaria/logger@4.0.0
  - @linaria/utils@4.0.0
