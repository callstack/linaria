# Bundlers Integration

## webpack

### Development

In order for webpack to pick up extracted CSS files, you need to setup [style-loader](https://github.com/webpack-contrib/style-loader) and [css-loader](https://github.com/webpack-contrib/css-loader).

__css-loader__ will wrap the CSS into JS module, which will be used by __style-loader__ in browser to create a
`<style>` elements with extracted CSS.

To configure webpack to use __style-loader__ and __css-loader__ add the following snippet to your webpack config:
```js
/* rest of your config */
module: {
  /* rest of your module config */
  rules: [
    /* rest of your rules */
    {
      test: /\.css$/,
      use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
    },
  ],
},
```

For this case you can use `linaria/babel` preset without any options:

```diff
{
  "presets": [
    "env",
+   "linaria/babel"
  ]
}
```

### Production

For production, you don't want to have `<style>` elements created dynamically, you should extract all CSS to a single file using [ExtractTextWebpackPlugin](https://github.com/webpack-contrib/extract-text-webpack-plugin).

In order to have your styles extracted with **ExtractTextWebpackPlugin**, you need to place the following snippet in your webpack production config:

```js
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  /* rest of your config */
  module: {
    /* rest of your module config */
    rules: [
      /* rest of your rules */
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader"
        }),
      },
    ],
  },
  plugins: [
    new ExtractTextPlugin("styles.css"),
  ],
};
```

This will extract the CSS from all files into a single `styles.css`. Then you need to include this file in your HTML file.

__NOTE__: When referencing files inside the CSS template literal, you can use `url(./path/to/asset.png)` instead of `url(${require('./path/to/asset.png')})` like you would do with other CSS-in-JS libraries. `url(...)` statements will be resolved and handled by webpack through __css_loader__ like normal `require` calls.
