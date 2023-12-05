# Migration Guide

# 6.x from 5.x, 4.x, 3.x

## For Users

The main breaking change is that all tooling has been moved from the `@linaria` scope to the `@wyw-in-js` scope. This means that you will need to update your dependencies as follows:

- `@linaria/vite` -> `@wyw-in-js/vite`
- `@linaria/cli` -> `@wyw-in-js/cli`
- `@linaria/babel-preset` -> `@wyw-in-js/babel-preset`

However, the `atomic`, `core`, and `styled` imports remain in the `@linaria` scope.

Additionally, support for Webpack v4 has been dropped. The webpack plugins have been renamed:

- `@linaria/webpack4-loader` has been discontinued
- `@linaria/webpack5-loader` has been renamed to `@wyw-in-js/webpack-loader`

There is no longer a need to install `@linaria/shaker` as it is now part of `@wyw-in-js/transform`, which will be installed automatically with the bundler plugins.

The configuration file has been renamed from `linariarc` to `wyw-in-jsrc`.

## For Custom Processor Developers

Base classes for processors and most helpers have been moved to `@wyw-in-js/processor-utils`.

All APIs that had `linaria` in their names have been renamed:

- The field that stores meta information in runtime has been renamed from `__linaria` to `__wyw_meta`
- The export with all interpolated values has been renamed from `__linariaPreval` to `__wywPreval`
- The caller name in Babel has been renamed from `linaria` to `wyw-in-js`

For additional information, please visit the [wyw-in-js.dev](https://wyw-in-js.dev).

# 4.x, 3.x from 2.x

This release was mostly a refactor to [split into more packages](https://github.com/callstack/linaria/pull/687/).

## Breaking changes

All these package imports in code need to be updated:

| Old | New
| --- | ---
|linaria | @linaria/core
|linaria/loader | @linaria/webpack4-loader, @linaria/webpack5-loader
|linaria/react | @linaria/react
|linaria/rollup | @linaria/rollup
|linaria/server | @linaria/server
|linaria/stylelint-config | @linaria/stylelint


The `shaker` evaluator has moved from `linaria/evaluators` into its own package. You'll need to add `@linaria/shaker` to your package.json even if you never import it.

The Babel preset moved from `linaria/babel` to `@linaria/babel-preset` but has to be referenced as `@linaria` in a Babel config. See https://github.com/callstack/linaria/issues/704


In package.json import all the new packages you use.

# 2.x from 1.x

## Breaking changes

### `Core-js` dependency removal and _theoretical_ drop compatibility for `node` below `10`

In [#569](https://github.com/callstack/linaria/pull/569) We removed `core-js` dependency.

It should not effectively affect your users or build pipelines. But it was technically a breaking change.

We set babel preset that makes all non-browser dependencies compatible with `node` from version `10`. But previous setup was using `browser` env so If you was able to build Linaria with previous versions of node, it should work also now. Support for browsers environment didn't change.

After that you should be able to solve issues with `core-js` dependency in your project, because it will no longer collide with version used by Linaria.

### The default [evaluation strategy](./HOW_IT_WORKS.md#evaluators) has been changed to `shaker` 

It should not affect existed code since the new strategy is more powerful, but you can always switch to the old one by adding the next `rules` section to your Linaria-config:
```js
  [
    {
      action: require('linaria/evaluators').extractor,
    },
    {
      test: /\/node_modules\//,
      action: 'ignore',
    },
  ]
``` 
