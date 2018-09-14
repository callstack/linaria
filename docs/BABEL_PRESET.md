# `linaria/babel` preset

The preset pre-processes and evaluates the CSS so that it can be extracted by the bundler. In order to have styles in `css` tagged template literals evaluated, you need to add the `linaria/babel` preset to your Babel configuration.

`.babelrc`:

```diff
{
  "presets": [
    "@babel/preset-env",
    "@babel/preset-react"
+   "linaria/babel"
  ]
}
```

Make sure that `linaria/babel` is the last item in your `presets` list.

Now, linaria will evaluate the `css` tags and extract styles to a CSS file for each JS file with the same name and inject `require` call with a path to the extracted CSS file.

For example, CSS file for `src/components/App.js` will be named `src/components/App.css` and will be written inside `.linaria-cache` with directory - `.linaria-cache/src/components/App.css`.

You can configure the preset by passing and object with options:

```json
{
  "presets": [
    ["linaria/babel", { "outDir": "css-output" }]
  ]
}
```

## Options

* `evaluate: boolean` (default: `false`) - Whether to evaluate dynamic expressions in the CSS. You need to enable this if you want to use imported variables in the CSS or interpolate other components.
