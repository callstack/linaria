---
'@linaria/babel-preset': patch
'@linaria/rollup': patch
'@linaria/shaker': patch
'@linaria/testkit': patch
'@linaria/utils': patch
'@linaria/vite': patch
'@linaria/webpack4-loader': patch
'@linaria/webpack5-loader': patch
'linaria-website': patch
---

The cache has been improved, which should address the build time issues for Webpack 4/5 and resolve HMR-related problems for Vite. Fixes #1199, #1265 and maybe some more.
