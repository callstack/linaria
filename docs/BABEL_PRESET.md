# `linaria/babel` preset

The preset pre-processes and evaluates the CSS. The bundler plugins use this preset under the hood. You also might want to use this preset if you import the components outside of the files handled by your bundler, such as on your server or in unit tests.

To use this preset, add `linaria/babel` to your Babel configuration at the end of the presets list:

`.babelrc`:

```diff
{
  "presets": [
    "@babel/preset-env",
    "@babel/preset-react",
+   "linaria/babel"
  ]
}
```

## Options

* `evaluate: boolean` (default: `true`) - Enabling this will evaluate dynamic expressions in the CSS. You need to enable this if you want to use imported variables in the CSS or interpolate other components. Enabling this also ensures that your styled components wrapping other styled components will have the correct specificity and override styles properly.
* `displayName: boolean` (default: `false`) - Enabling this will add a display name to generated class names, e.g. `.Title_abcdef` instead of `.abcdef'. It is disabled by default to generate smaller CSS files.
* `ignore: RegExp` (default: `/node_modules/`) - If you specify a regex here, files matching the regex won't be processed, i.e. the matching files won't be transformed with Babel during evaluation. If you need to transpile certain modules under `/node_modules/`, it's recommended to do it on a module by module basis for faster transforms, e.g. `ignore: /node_modules[\/\\](?!some-module|other-module)/`.
