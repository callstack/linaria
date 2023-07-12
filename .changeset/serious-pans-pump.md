---
'@linaria/babel-preset': minor
'@linaria/griffel': minor
'@linaria/react': minor
'@linaria/tags': minor
'@linaria/testkit': minor
'@linaria/utils': minor
'@linaria/atomic': minor
'@linaria/cli': minor
'@linaria/core': minor
'@linaria/esbuild': minor
'@linaria/extractor': minor
'@linaria/babel-plugin-interop': minor
'linaria': minor
'@linaria/logger': minor
'@linaria/postcss-linaria': minor
'@linaria/rollup': minor
'@linaria/server': minor
'@linaria/shaker': minor
'@linaria/stylelint': minor
'@linaria/stylelint-config-standard-linaria': minor
'@linaria/vite': minor
'@linaria/webpack-loader': minor
'@linaria/webpack4-loader': minor
'@linaria/webpack5-loader': minor
'linaria-website': minor
---

Breaking Change: Performance Optimization for `styled`

When a component is wrapped in `styled`, Linaria needs to determine if that component is already a styled component. To accomplish this, the wrapped component is included in the list of variables for evaluation, along with the interpolated values used in styles. The issue arises when a wrapped component, even if it is not styled, brings along a substantial dependency tree. This situation is particularly evident when using `styled` to style components from third-party UI libraries.

To address this problem, Linaria will now examine the import location of the component and check if there is an annotation in the `package.json` file of the package containing the components. This annotation indicates whether the package includes other Linaria components. If there is no such annotation, Linaria will refrain from evaluating the component.

Please note that this Breaking Change solely affects developers of component libraries. In order for users to style components from your library, you must include the `linaria.components` property in the library's `package.json` file. This property should have a mask that covers all imported files with components. Here's an example of how to specify it:

```json
"linaria": {
  "components": "**/*"
}
```
