---
'@linaria/atomic': patch
'@linaria/core': patch
'@linaria/react': patch
'@linaria/stylelint': patch
---

Update WyW dependencies to 2.7.2

The `@wyw-in-js/*` dependencies move from 2.7.1 to 2.7.2. Linaria styles are compiled by the WyW integration of your bundler, and each integration depends on an exact version of `@wyw-in-js/transform`, so update `@wyw-in-js/vite`, `@wyw-in-js/webpack-loader` or the integration you use to 2.7.2 as well: the build runs the transform that the integration installs.

Changes from this release that reach Linaria builds:

- `@wyw-in-js/shared` and `@wyw-in-js/transform` depend on `minimatch` 11 instead of 9, so a fresh install no longer resolves a `minimatch` release affected by GHSA-g3hv-75wg-m249 (denial of service through globparts amplification), which has no fix in the 9.x line.
- Build-time evaluation with DOM emulation (`features.happyDOM`, on by default) runs in a single JavaScript realm, so checks such as `[] instanceof Array` or `error instanceof TypeError` in evaluated code give the same results as with `happyDOM: false`.
- A call to a function or class whose body assigns an outer binding with `=`, such as `let n = 0; function init() { n = 5; } init();`, is kept when a module is prepared for evaluation, so styles read the assigned value instead of the initial one.
- Statements that read `new.target` are kept when a module is prepared for evaluation; before, they were removed as if they read `import.meta`.
- An SSR check such as `typeof(window)`, `typeof (window as any)` or `typeof window!` is treated as `"undefined"` during build-time evaluation, as the bare `typeof window` already was.
- The Rollup and esbuild integrations print processor diagnostics as warnings instead of dropping them.
- Processor lookups and the waits between transform steps are cheaper in projects with many modules or many transforms in flight.

Two changes can alter the CSS of existing code. With the default `hybrid` evaluation strategy, a module-level value that a function, constructor, method or callback changes while the module loads is now evaluated instead of resolved from its declaration: `let size = 0; function init() { size += 5; } init();` used to produce `0` and now produces `5`, and with the `static` strategy such a value now fails with the usual message about values it could not resolve. A module `var` that an interpolation reads above its declaration now gives the value that evaluation sees, as in the `execute` strategy.
