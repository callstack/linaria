# Migration Guide

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
