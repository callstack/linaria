---
'@linaria/shaker': patch
'@linaria/utils': patch
---

Fix an incorrect dead-code detection when a function has a parameter with the same name as the function itself. Fixes #1055
