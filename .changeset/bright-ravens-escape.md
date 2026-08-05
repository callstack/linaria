---
'@linaria/postcss-linaria': patch
---

Preserve source escapes within fields changed by fixers

When a fixer changes part of a selector or declaration value, the stringifier now compares the original and changed CSS escape tokens. Retained source backslashes remain unchanged, while backslashes added by the fixer are still escaped for the surrounding JavaScript template (#1508).
