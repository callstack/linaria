# `linaria/babel` preset

The preset pre-processes and evaluates the CSS so that it can be extracted by the bundler. In order to have styles in `css` tagged template literals evaluated, you need to add the `linaria/babel` preset to your Babel configuration.

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

Make sure that `linaria/babel` is the last item in your `presets` list.

## Options

* `evaluate: boolean` (default: `true`) - Enabling this will evaluate dynamic expressions in the CSS. You need to enable this if you want to use imported variables in the CSS or interpolate other components. Enabling this also ensures that your styled components wrapping other styled components will have the correct specificity and override styles properly.
* `displayName: boolean` (default: `false`) - Enabling this will add a display name to generated class names, e.g. `.Title_abcdef` instead of `.abcdef'. It is disabled by default to generate smaller CSS files.
