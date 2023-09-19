---
'@linaria/testkit': patch
'@linaria/utils': patch
---

The exports finder didn't support enums that were transpiled to esm by tsc. Fixed.
