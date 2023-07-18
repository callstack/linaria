---
'@linaria/atomic': patch
'@linaria/babel-preset': patch
'@linaria/cli': patch
'@linaria/core': patch
'@linaria/esbuild': patch
'@linaria/griffel': patch
'@linaria/babel-plugin-interop': patch
'@linaria/postcss-linaria': patch
'@linaria/react': patch
'@linaria/shaker': patch
'@linaria/tags': patch
'@linaria/testkit': patch
'@linaria/utils': patch
'linaria-website': patch
---

Shaker mistakenly counts references in types as valuable and keeps referenced variables alive.
