---
'@linaria/babel-preset': patch
'@linaria/utils': patch
---

Shaker tried to keep alive object methods even if their body was removed (fixes #1018)
