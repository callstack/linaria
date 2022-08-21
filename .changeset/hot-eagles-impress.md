---
'@linaria/babel-preset': patch
'@linaria/react': patch
'@linaria/tags': patch
'@linaria/webpack4-loader': patch
'@linaria/webpack5-loader': patch
---

Sometimes Linaria can meet already processed code. In such a case, it shall ignore runtime versions of `styled` tags. Fixes #1037.
