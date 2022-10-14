---
'@linaria/shaker': patch
'@linaria/utils': patch
---

Fix rare use case when `void`-expression causes too aggressive tree-shaking. Fixes #1055.
