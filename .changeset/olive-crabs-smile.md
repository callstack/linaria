---
'@linaria/postcss-linaria': patch
---

Fix interpolations and comments being dropped from multi-line selectors and at-rule params

An interpolation that continues a selector onto the next line looks like a ruleset, so it gets a comment placeholder. PostCSS keeps that comment only in `raws.selector.raw`, and the re-indented selector was read from `selector`, so `~ .${styles.parent}` came out as `~ .` on any `stylelint --fix`. Multi-line at-rule params had the same problem via `raws.params.raw`.

The same defect was fixed for `decl.value` in the previous release (#1494); the selector and params paths were missed. All three now read the raw form through `computeCorrectedRawValue`.

Hand-written comments were dropped by the same code path, so a comment inside a multi-line selector or multi-line at-rule params now survives too, interpolations or not.
