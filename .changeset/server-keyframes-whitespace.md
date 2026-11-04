---
'@linaria/server': patch
---

`collect` gives the keyframes it appends to the critical CSS the same whitespace with postcss 8.4 and 8.5. With postcss 8.5.19 and later, a blank line that preceded the keyframes in the source stylesheet ended up in the critical CSS.
