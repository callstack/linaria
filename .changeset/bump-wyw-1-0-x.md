---
'@linaria/atomic': major
'@linaria/babel-plugin-interop': major
'@linaria/core': major
'@linaria/postcss-linaria': major
'@linaria/react': major
'@linaria/server': major
'@linaria/stylelint': major
'@linaria/stylelint-config-standard-linaria': major
'@linaria/testkit': major
linaria: major
---

BREAKING: bump `@wyw-in-js/*` dependencies to `^1.0.0` (stable).

This release updates Linaria's build-time evaluation engine (WyW). See https://wyw-in-js.dev/stability for practical guidance and common pitfalls.

Notes:

- If you import JSON from code that is evaluated by WyW, add `.json` to `extensions` and ensure `.json` is ignored by evaluation rules (so it's parsed as JSON, not by Babel).
- Rollup users: WyW 1.x serializes `transform()` by default (`serializeTransform: true`). If you hit Rollup "Unexpected early exit" (unresolved plugin promises / deadlock during resolve), set `serializeTransform: false` (see `examples/rollup/rollup.config.mjs`).
- WyW 1.x promotes fully-statically-evaluatable modules to `only: ['*']` and can re-evaluate modules when cached exports are incomplete (cached export values might not be reused).
