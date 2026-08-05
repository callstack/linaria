---
'@linaria/postcss-linaria': patch
---

Keep comment indentation stable through `stylelint --fix`

Indented templates no longer add their base indentation before trailing comments or remove it from continuation lines inside multi-line comments. Repeated parse/stringify passes now preserve both forms byte-for-byte (#1502).
