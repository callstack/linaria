---
'@linaria/postcss-linaria': patch
---

Fix adjacent interpolations being mangled by `stylelint --fix`

`substitutePlaceholders` split each whitespace-separated token on the placeholder marker and only read the first two parts, so a token holding more than one interpolation — an attribute selector like `&[${a}][${b}]`, or a value like `margin: ${a}${b}` — silently lost everything from the second interpolation onward, corrupting the output into invalid CSS (#1498).
