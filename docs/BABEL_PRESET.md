# `linaria/babel` preset

The preset pre-processes and evaluates the CSS. The webpack loader and Rollup plugin use this preset under the hood. You also might want to use this preset if you import the components outside webpack or Rollup, such as on your server or in unit tests.

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
