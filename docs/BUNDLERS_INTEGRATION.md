# Bundlers Integration

## webpack

To use Linaria wih webpack, in your webpack config, add `linaria/loader`:

```js
/* rest of your config */
module: {
  /* rest of your module config */
  rules: [
    /* rest of your rules */
    {
      test: /\.js$/,
      use: [
        { loader: 'babel-loader' },
        {
          loader: 'linaria/loader',
          options: {
            sourceMap: process.env.NODE_ENV !== 'production',
          },
        }
      ],
    },
  ],
},
```

Make sure that `linaria/loader` is included after `babel-loader`. Setting the `sourceMap` option to `true` will include source maps for the generated CSS so that you can see where source of the class name in devtools. We recommend to enable this only in development mode because the sourcemap is inlined into the CSS files.

The loader accepts same options as the [babel preset](/docs/BABEL_PRESET.md).

In order to have your styles extracted, you'll also need to use **css-loader** and **MiniCssExtractPlugin**. First, install them:

```sh
yarn add --dev css-loader mini-css-extract-plugin
```

To do that, you can add the following snippet in your webpack config:

```js
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  /* rest of your config */
  module: {
    /* rest of your module config */
    rules: [
      /* rest of your rules */
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: process.env.NODE_ENV !== 'production',
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'styles.css',
    }),
  ],
};
```

This will extract the CSS from all files into a single `styles.css`. Then you need to link to this file in your HTML file or use something like [`HTMLWebpackPlugin`](https://github.com/jantimon/html-webpack-plugin).

If you want to hot reload your styles when they change, you will also need to configure [`style-loader`](https://github.com/webpack-contrib/style-loader) or [`css-hot-loader`](https://github.com/shepherdwind/css-hot-loader).

Linaria integrates with your CSS pipeline, so you can always perform additional operations on the CSS, for example, using [postcss](https://postcss.org/) plugins such as [clean-css](https://github.com/jakubpawlowicz/clean-css) to further minify your CSS.

## Rollup

To use Linaria with Rollup, you need to use it together with a plugin which handles CSS files, such as `rollup-plugin-css-only`:

```sh
yarn add --dev rollup-plugin-css-only
```

Then add them to your `rollup.config.js`:

```js
import linaria from 'linaria/rollup';
import css from 'rollup-plugin-css-only';

export default {
  /* rest of your config */
  plugins: [
    /* rest of your plugins */
    linaria({
      sourceMap: process.env.NODE_ENV !== 'production'
    }),
    css({
      output: 'styles.css'
    })
  ]
};
```
