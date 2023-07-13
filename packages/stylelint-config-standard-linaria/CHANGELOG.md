# @linaria/stylelint-config-standard-linaria

## 4.2.0

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
- Updated dependencies [16c057df]
- Updated dependencies [af5bb92d]
  - @linaria/postcss-linaria@4.2.0

## 4.1.5

### Patch Changes

- e6420897: Update patch version so npm will pick up readme change
- Updated dependencies [5edde648]
- Updated dependencies [e6420897]
  - @linaria/postcss-linaria@4.1.5

## 4.1.4

### Patch Changes

- Updated dependencies [4c2efaa9]
  - @linaria/postcss-linaria@4.1.4

## 4.1.3

### Patch Changes

- ce36da42: Add stylelint v14 custom syntax support
- Updated dependencies [ce36da42]
  - @linaria/postcss-linaria@4.1.3
