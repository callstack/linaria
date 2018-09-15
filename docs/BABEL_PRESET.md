# `linaria/babel` preset

The preset pre-processes and evaluates the CSS so that it can be extracted by the bundler. In order to have styles in `css` tagged template literals evaluated, you need to add the `linaria/babel` preset to your Babel configuration.

`.babelrc`:

```diff
{
  "presets": [
    "@babel/preset-env",
    "@babel/preset-react"
+   ["linaria/babel", { "evaluate": true }]
  ]
}
```

Make sure that `linaria/babel` is the last item in your `presets` list.

## Options

* `evaluate: boolean` (default: `false`) - Whether to evaluate dynamic expressions in the CSS. You need to enable this if you want to use imported variables in the CSS or interpolate other components.
