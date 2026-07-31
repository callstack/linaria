---
'@linaria/postcss-linaria': patch
---

Fix interpolations and indentation being mangled by `stylelint --fix`

An interpolation alone on its own line gets a comment placeholder. Inside a parenthesised value PostCSS keeps that comment only in `raws.value.raw`, and the re-indented value was read from `value`, so the placeholder was gone by the time the stringifier ran, and the interpolation with it (#1494).

Multi-line at-rule params were corrupted rather than dropped: `super.atrule` re-reads params through `rawValue`, so substituting into `node.params` was discarded and `@media screen and ${query}` came out as `@media screen and .pcss-lin0`. An interpolation on the line after the at-rule name lands in the `afterName` raw and was emitted verbatim for the same reason.

A newline inside `afterName` also never had its base indentation restored, so a wrapped at-rule prelude lost its leading whitespace on any fix, templates with no interpolations at all included.
