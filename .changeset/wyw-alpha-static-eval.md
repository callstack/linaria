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

Release Linaria 8 with WyW 2.x stable dependencies and Node.js 22.12+ support.

Linaria processors now expose WyW 2 static evaluation semantics, allowing the default `eval.strategy: "hybrid"` mode to resolve statically provable values before falling back to the evaluator. This keeps existing dynamic/runtime-only interpolation support while reducing evaluator work for values that can be resolved from static bindings and imports.

Migration notes:

- Node.js 22.12 or newer is required.
- `@wyw-in-js/transform` is updated to 2.0.1 to avoid duplicate CSS emitted for same-file processor bindings referenced from another processor template inside a local scope.
- Top-level `evaluate` config should be migrated to `eval.strategy`. Use `execute` for evaluator-only compatibility, keep the default `hybrid` for static-first resolution with fallback, or use `static` to reject evaluator fallback.
- Babel config and Babel resolver plugins are no longer used as an implicit module-resolution fallback during WyW evaluation. Move build-time alias handling to WyW configuration with `eval.customResolver`, `eval.resolver`, or `staticBindings`.
- CSS rule emission order may change for cascade ties with identical specificity because WyW 2 uses the Oxc/static-first pipeline and can preserve/process imports differently. Make precedence explicit with selector specificity, composition, or source structure where order matters.
