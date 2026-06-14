---
"@linaria/atomic": major
"@linaria/core": major
"@linaria/babel-plugin-interop": major
"linaria": major
"@linaria/postcss-linaria": major
"@linaria/react": major
"@linaria/server": major
"@linaria/stylelint-config-standard-linaria": major
"@linaria/stylelint": major
---

Release Linaria 8 with WyW 2.0.0 stable dependencies and Node.js 22+ support.

Linaria processors now expose WyW 2 static evaluation semantics, allowing the default `eval.strategy: "hybrid"` mode to resolve statically provable values before falling back to the evaluator. This keeps existing dynamic/runtime-only interpolation support while reducing evaluator work for values that can be resolved from static bindings and imports.

Migration notes:

- Node.js 22 or newer is required.
- Top-level `evaluate` config should be migrated to `eval.strategy`. Use `execute` for evaluator-only compatibility, keep the default `hybrid` for static-first resolution with fallback, or use `static` to reject evaluator fallback.
- CSS rule emission order may change for cascade ties with identical specificity because WyW 2 uses the Oxc/static-first pipeline and can preserve/process imports differently. Make precedence explicit with selector specificity, composition, or source structure where order matters.
