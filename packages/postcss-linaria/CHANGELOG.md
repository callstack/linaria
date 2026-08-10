# Change Log

## 8.2.0

### Patch Changes

- d3b131dc: Preserve source escapes within fields changed by fixers

  When a fixer changes part of a selector or declaration value, the stringifier now compares the original and changed CSS escape tokens. Retained source backslashes remain unchanged, while backslashes added by the fixer are still escaped for the surrounding JavaScript template (#1508).

- c7b0360e: Keep comment indentation stable through `stylelint --fix`

  Indented templates no longer add their base indentation before trailing comments or remove it from continuation lines inside multi-line comments. Repeated parse/stringify passes now preserve both forms byte-for-byte (#1502).

- cc438354: Fix interpolations and comments being dropped from multi-line selectors and at-rule params

  An interpolation that continues a selector onto the next line looks like a ruleset, so it gets a comment placeholder. PostCSS keeps that comment only in `raws.selector.raw`, and the re-indented selector was read from `selector`, so `~ .${styles.parent}` came out as `~ .` on any `stylelint --fix`. Multi-line at-rule params had the same problem via `raws.params.raw`.

  The same defect was fixed for `decl.value` in the previous release (#1494); the selector and params paths were missed. All three now read the raw form through `computeCorrectedRawValue`.

  Hand-written comments were dropped by the same code path, so a comment inside a multi-line selector or multi-line at-rule params now survives too, interpolations or not.

- ee377a44: Stop `stylelint --fix` from rewriting templates it should leave alone

  Backslashes inside a template were doubled on the way out and doubled again on every later run (#1497). Restored `${...}` expressions were passed through the same CSS escaping, so a backtick inside an expression was escaped and could leave the JavaScript unparseable.

  The parser now records each source-derived field before Stylelint rules run. The stringifier leaves backslashes in unchanged fields alone, retains the existing escaping for fields written by fixers, and restores interpolation placeholders only after escaping. The complete JavaScript expression source therefore stays unchanged, and repeated parse/stringify passes are idempotent.

  Fixers can continue to write CSS values with their normal escaping; the stringifier still translates those values into safe JavaScript template source.

- 832c1f88: Preserve source prefixes before interpolations

  The parser now records whether it added a synthetic `.` or `--` to keep an interpolation parseable. The stringifier removes only that recorded marker, so `stylelint --fix` no longer drops a real leading dot from selectors such as `.\${className}` (#1501).

- f3871e64: Fix adjacent interpolations being mangled by `stylelint --fix`

  `substitutePlaceholders` split each whitespace-separated token on the placeholder marker and only read the first two parts, so a token holding more than one interpolation — an attribute selector like `&[${a}][${b}]`, or a value like `margin: ${a}${b}` — silently lost everything from the second interpolation onward, corrupting the output into invalid CSS (#1498).

- d28a5a88: Fix interpolations and indentation being mangled by `stylelint --fix`

  An interpolation alone on its own line gets a comment placeholder. Inside a parenthesised value PostCSS keeps that comment only in `raws.value.raw`, and the re-indented value was read from `value`, so the placeholder was gone by the time the stringifier ran, and the interpolation with it (#1494).

  Multi-line at-rule params were corrupted rather than dropped: `super.atrule` re-reads params through `rawValue`, so substituting into `node.params` was discarded and `@media screen and ${query}` came out as `@media screen and .pcss-lin0`. An interpolation on the line after the at-rule name lands in the `afterName` raw and was emitted verbatim for the same reason.

  A newline inside `afterName` also never had its base indentation restored, so a wrapped at-rule prelude lost its leading whitespace on any fix, templates with no interpolations at all included.

## 8.1.1

## 8.1.0

### Patch Changes

- 45539fd0: Remove package dependencies that are no longer used by Linaria.
- b8877315: Mark extracted template CSS roots as `template-literal` so Stylelint 14 rules can lint top-level declarations.

## 8.0.0

### Major Changes

- 9d49bef8: Release Linaria 8 with WyW 2.x stable dependencies and Node.js 22.12+ support.

  Linaria processors now expose WyW 2 static evaluation semantics, allowing the default `eval.strategy: "hybrid"` mode to resolve statically provable values before falling back to the evaluator. This keeps existing dynamic/runtime-only interpolation support while reducing evaluator work for values that can be resolved from static bindings and imports.

  Performance and stability:

  With the default hybrid mode, a large share of style computation now moves out of runtime-like evaluator execution and into analytical static evaluation. This reduces evaluator startup and module execution work, makes builds less sensitive to runtime-only side effects, and gives the pipeline a more stable foundation for further optimization. It also opens the path for substantially larger speedups as WyW moves more of the pipeline to Rust; see the [WyW roadmap](https://wyw-in-js.dev/stability#roadmap-high-level) for more detail.

  Migration notes:

  - Node.js 22.12 or newer is required.
  - `@wyw-in-js/transform` is updated to 2.0.2 to avoid duplicate CSS emitted for same-file processor bindings referenced from another processor template inside a local scope and to keep mixed static/processor object-member interpolations statically resolvable.
  - Top-level `evaluate` config should be migrated to `eval.strategy`. Use `execute` for evaluator-only compatibility, keep the default `hybrid` for static-first resolution with fallback, or use `static` to reject evaluator fallback.
  - Babel config and Babel resolver plugins are no longer used as an implicit module-resolution fallback during WyW evaluation. Move build-time alias handling to WyW configuration with `eval.customResolver`, `eval.resolver`, or `staticBindings`.
  - CSS rule emission order may change for cascade ties with identical specificity because WyW 2 uses the Oxc/static-first pipeline and can preserve/process imports differently. Make precedence explicit with selector specificity, composition, or source structure where order matters.

## 7.0.0

### Major Changes

- ab11ebb7: BREAKING: bump `@wyw-in-js/*` dependencies to `^1.0.0` (stable).

  This release updates Linaria's build-time evaluation engine (WyW). See https://wyw-in-js.dev/stability for practical guidance and common pitfalls.

  Notes:

  - Linaria 7 requires Node.js 20+ (aligned with WyW 1.x).
  - If you import JSON from code that is evaluated by WyW, add `.json` to `extensions` and ensure `.json` is ignored by evaluation rules (so it's parsed as JSON, not by Babel).
  - Rollup users: WyW 1.x serializes `transform()` by default (`serializeTransform: true`). If you hit Rollup "Unexpected early exit" (unresolved plugin promises / deadlock during resolve), set `serializeTransform: false` (see `examples/rollup/rollup.config.mjs`).
  - WyW 1.x promotes fully-statically-evaluatable modules to `only: ['*']` and can re-evaluate modules when cached exports are incomplete (cached export values might not be reused).

### Patch Changes

- b04f025e: Fix `@linaria/postcss-linaria` placeholder naming and source location correction, and ensure stylelint integration resolves configs correctly.

## 6.3.0

### Minor Changes

- 281ca4f5: The new version of wyw-in-js, with the support of a configurable code remover, can help prevent compilation errors and improve build time.

## 6.2.0

### Minor Changes

- a3dcee2e: Update wyw-in-js to 0.5.3

## 6.1.0

### Minor Changes

- 8ba655d3: Bump wyw-in-js to 0.4.0. The full list of changes https://github.com/Anber/wyw-in-js/compare/%40wyw-in-js/transform%400.2.3...%40wyw-in-js/transform%400.4.0

## 6.0.0

### Major Changes

- 2ac94b99: BREAKING CHANGE: Linaria has been migrated to wyw-in-js.

  # Migration Guide

  ## For Users

  The main breaking change is that all tooling has been moved from the `@linaria` scope to the `@wyw-in-js` scope. This means that you will need to update your dependencies as follows:

  | Old                      | New                       |
  | ------------------------ | ------------------------- |
  | @linaria/babel-preset    | @wyw-in-js/babel-preset   |
  | @linaria/cli             | @wyw-in-js/cli            |
  | @linaria/esbuild         | @wyw-in-js/esbuild        |
  | @linaria/rollup          | @wyw-in-js/rollup         |
  | @linaria/shaker          | discontinued              |
  | @linaria/vite            | @wyw-in-js/vite           |
  | @linaria/webpack4-loader | discontinued              |
  | @linaria/webpack5-loader | @wyw-in-js/webpack-loader |

  There is no longer a need to install `@linaria/shaker` as it is now part of `@wyw-in-js/transform`, which will be installed automatically with the bundler plugins.

  The configuration file has been renamed from `linaria.config.js` (`linariarc`) to `wyw-in-js.config.js` (`.wyw-in-jsrc`).

  ## For Custom Processor Developers

  Base classes for processors and most helpers have been moved to `@wyw-in-js/processor-utils`.

  All APIs that had `linaria` in their names have been renamed:

  - The field that stores meta information in runtime has been renamed from `__linaria` to `__wyw_meta`
  - The export with all interpolated values has been renamed from `__linariaPreval` to `__wywPreval`
  - The caller name in Babel has been renamed from `linaria` to `wyw-in-js`

  For additional information, please visit the [wyw-in-js.dev](https://wyw-in-js.dev).

### Patch Changes

- 63392f9a: Fix the expressions in at-rule parameters and rules with functions. Fixes #1074

## 5.0.0

### Major Changes

- 88e07613: Rewritten dependecny tree processing with support for wildcard re-exports.
- cb853e14: All processing stages were merged into one generators-based processor. It allows the implementation of more complex workflows to support features like dynamic imports and re-exports.

### Minor Changes

- 9cb4143d: Refactoring of the 1st stage of transformation. It opens the road to processing wildcard reexports.

### Patch Changes

- 2a1e24a0: Upgrade TypeScript to 5.2

## 4.5.1

### Patch Changes

- e59bf809: Shaker mistakenly counts references in types as valuable and keeps referenced variables alive.

## 4.5.0

### Patch Changes

- af5bb92d: The end of support for Node.js 14. Migration to pnpm 8.

## 4.1.5

### Patch Changes

- 5edde648: Upgrade Babel to support TypeScript 4.9. Fixes #1133.
- e6420897: Update patch version so npm will pick up readme change

## 4.1.4

### Patch Changes

- 4c2efaa9: Only lint when file can be parsed by babel, reduce noisey errors during dev

## 4.1.3

### Patch Changes

- ce36da42: Add stylelint v14 custom syntax support
