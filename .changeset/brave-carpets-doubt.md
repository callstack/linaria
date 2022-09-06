---
'@linaria/babel-preset': patch
'@linaria/utils': patch
---

Fix for incorrect shaker behaviour when it tries to keep a function declaration with a removed body (fixes #1036).
