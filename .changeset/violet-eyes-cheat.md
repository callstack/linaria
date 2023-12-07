---
'@linaria/atomic': major
'@linaria/core': major
'@linaria/babel-plugin-interop': major
'linaria': major
'@linaria/postcss-linaria': major
'@linaria/react': major
'@linaria/stylelint': major
'@linaria/stylelint-config-standard-linaria': major
'@linaria/testkit': major
'linaria-website': major
'@linaria/server': major
---

BREAKING CHANGE: Linaria has been migrated to wyw-in-js.

# Migration Guide

## For Users

The main breaking change is that all tooling has been moved from the `@linaria` scope to the `@wyw-in-js` scope. This means that you will need to update your dependencies as follows:

| Old | New
| --- | ---
|@linaria/babel-preset | @wyw-in-js/babel-preset
|@linaria/cli | @wyw-in-js/cli
|@linaria/esbuild | @wyw-in-js/esbuild
|@linaria/rollup | @wyw-in-js/rollup
|@linaria/shaker | discontinued
|@linaria/vite | @wyw-in-js/vite
|@linaria/webpack4-loader | discontinued
|@linaria/webpack5-loader | @wyw-in-js/webpack-loader

There is no longer a need to install `@linaria/shaker` as it is now part of `@wyw-in-js/transform`, which will be installed automatically with the bundler plugins.

The configuration file has been renamed from `linaria.config.js` (`linariarc`) to `wyw-in-js.config.js` (`.wyw-in-jsrc`).

## For Custom Processor Developers

Base classes for processors and most helpers have been moved to `@wyw-in-js/processor-utils`.

All APIs that had `linaria` in their names have been renamed:

- The field that stores meta information in runtime has been renamed from `__linaria` to `__wyw_meta`
- The export with all interpolated values has been renamed from `__linariaPreval` to `__wywPreval`
- The caller name in Babel has been renamed from `linaria` to `wyw-in-js`

For additional information, please visit the [wyw-in-js.dev](https://wyw-in-js.dev).
