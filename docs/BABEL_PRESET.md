# `linaria/babel` preset

The preset pre-processes and evaluates the CSS. The webpack loader uses this preset under the hood. You don't need to use add this plugin if you're using the webpack loader.

If you need to use this preset for some reason, add `linaria/babel` to your Babel configuration at the end of your presets list:

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
