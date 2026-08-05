---
'@linaria/postcss-linaria': patch
---

Preserve source prefixes before interpolations

The parser now records whether it added a synthetic `.` or `--` to keep an interpolation parseable. The stringifier removes only that recorded marker, so `stylelint --fix` no longer drops a real leading dot from selectors such as `.\${className}` (#1501).
