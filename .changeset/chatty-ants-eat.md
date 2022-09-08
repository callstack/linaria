---
'@linaria/babel-preset': minor
'@linaria/shaker': minor
'@linaria/utils': minor
---

In some cases, different parts of babel-preset could use different versions of installed @babel/core. It caused the ".key is not a valid Plugin property" error. Fixed.
