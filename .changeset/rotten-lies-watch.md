---
'@linaria/babel-preset': patch
'@linaria/utils': patch
---

If an expression in a string literal is deleted during preeval stage, it should be replaced with an empty string. Fixes #1039.
