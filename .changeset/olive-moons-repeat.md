---
'@linaria/postcss-linaria': patch
---

Stop `stylelint --fix` from rewriting templates it should leave alone

Backslashes inside a template were doubled on the way out and doubled again on every later run (#1497). Restored `${...}` expressions were passed through the same CSS escaping, so a backtick inside an expression was escaped and could leave the JavaScript unparseable.

The parser now records each source-derived field before Stylelint rules run. The stringifier leaves backslashes in unchanged fields alone, retains the existing escaping for fields written by fixers, and restores interpolation placeholders only after escaping. The complete JavaScript expression source therefore stays unchanged, and repeated parse/stringify passes are idempotent.

Fixers can continue to write CSS values with their normal escaping; the stringifier still translates those values into safe JavaScript template source.
