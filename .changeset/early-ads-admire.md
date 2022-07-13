---
'@linaria/atomic': major
'@linaria/babel-preset': major
'@linaria/cli': major
'@linaria/core': major
'@linaria/esbuild': major
'@linaria/extractor': major
'@linaria/babel-plugin-interop': major
'@linaria/logger': major
'@linaria/react': major
'@linaria/rollup': major
'@linaria/shaker': major
'@linaria/stylelint': major
'@linaria/testkit': major
'@linaria/utils': major
'@linaria/webpack4-loader': major
'@linaria/webpack5-loader': major
'linaria-website': major
'linaria': major
'@linaria/server': major
'@linaria/webpack-loader': major
---

A completely new async mode with native support for Vite, Rollup, esbuild and Webpack resolvers.

BREAKING CHANGES: Despite the fact, that it should be fully compatible with 3.0 and 2.0 branches, the new version of styles evaluator can have some serious bugs which can make your project unbuildable (however, since there is no runtime, if the build is finished successfully, everything will continue work as it was on 2.0 and 3.0). If you face some problems please let us know and we will fix it as soon as possible.