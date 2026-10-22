---
'@linaria/server': patch
---

`collect` no longer moves rules out of the parsed stylesheet one by one. That made it quadratic in the number of top-level rules and took seconds on large stylesheets.

It also fixes two bugs:

- `other` lost rules from an at-rule when a non-critical rule came before a critical one;
- `blockedClasses` let every second matching rule into `critical`.

Whitespace between rules in the output now follows the source stylesheet.
