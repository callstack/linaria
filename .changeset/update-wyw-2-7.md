---
'@linaria/atomic': minor
'@linaria/core': minor
'@linaria/react': minor
'@linaria/stylelint': minor
---

Update WyW dependencies to 2.7.1

The `@wyw-in-js/*` dependencies move from 2.4 to 2.7.1, across the 2.5, 2.6 and 2.7 releases of WyW. Linaria styles are compiled by the WyW integration of your bundler, and each integration depends on an exact version of `@wyw-in-js/transform`, so update `@wyw-in-js/vite`, `@wyw-in-js/webpack-loader` or the integration you use to 2.7.1 as well: the build runs the transform that the integration installs.

Changes from these releases that reach Linaria builds:

- A fresh install no longer resolves the `minimatch` and `happy-dom` releases with known security advisories.
- A destructuring declaration that the output still uses is kept, together with the helpers its default values and computed keys call. Before, the emitted module could throw a `ReferenceError` or read `undefined` bindings.
- Interpolation functions that destructure, such as `${({ size }) => { const { radius } = sizes[size]; return radius; }}`, no longer fail with "local snapshot depends on executed side effects that cannot be safely hoisted".
- A parameter or local variable that shares its name with an imported `css` or `styled` is no longer treated as a call of that tag.
- A module that re-exports a value with `export { … } from` and also uses it in its own styles no longer loses its CSS when a module that imports it is built first.
- A namespace import stored in an object, such as `export const theme = { colors: tokens }`, keeps the exports of the imported module during build-time evaluation instead of reading `undefined`.
- Build-time evaluation handles `.js` dependencies that contain JSX, `.cts` dependencies with TypeScript syntax and browser globals behind TypeScript wrappers such as `(window as any).innerWidth`, and evaluates multi-line template literals exactly as written.
- Builds where a loader changes a module before WyW, such as Storybook's `react-docgen-loader`, and builds that share one cache across concurrent transforms no longer fail with `AbortError: superseded`.
- Watch builds (`vite build --watch`, Rollup and esbuild watch) rebuild a file when a module its styles are evaluated from changes, directly or through other modules. Rspack watch builds no longer emit the CSS of the previous build.
- `styled()` of a component imported from another module no longer repeats the package lookup for every component. CSS extraction and the search for tag usages no longer slow down quadratically with the number of styles in a file, and the loop check of large module graphs no longer takes exponential time.
- `@wyw-in-js/babel-preset` parses the transformed code with the syntax plugins of the file, so JSX and TypeScript files with Linaria styles no longer fail to compile.
- With `@wyw-in-js/rollup`, a module from which no CSS is extracted gets its transformed code, so the runtime of a tag no longer ends up in the bundle.
- In Vite dev, the generated CSS of a module requested with `?direct` is served as a stylesheet.
- CSS source maps point at the right lines for rules that span several lines.

An option set to `undefined` now counts as not set. If your bundler config passes `classNameSlug` or `displayName` as `undefined`, the value from the WyW config file applies instead, which can change the generated class names.

WyW 2.6 adds opt-in worker threads for transforms (the `parallel` option of the Vite, esbuild and webpack integrations), and in WyW 2.7 an explicit `configFile` can be a `.mts` or `.cts` file.
