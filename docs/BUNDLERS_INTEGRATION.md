# Bundlers Integration

## webpack

The webpack loader complements the babel plugin. For static extraction to work, you'll need to include both.

In your Webpack config, you'll need to add `linaria/loader` to run it on `.js` files:

```js
/* rest of your config */
module: {
  /* rest of your module config */
  rules: [
    /* rest of your rules */
    {
      test: /\.js$/,
      use: [
        {
          loader: 'linaria/loader',
          options: {
            sourceMap: process.env.NODE_ENV !== 'production',
          },
        },
        {
          loader: 'babel-loader'
        }
      ],
    },
  ],
},
```

Make sure that `linaria/loader` is included before `babel-loader`. Setting the `sourceMap` option to `true` will include source maps for the generated CSS so that you can see where source of the class name in devtools. We recommend to enable this only in development mode because the sourcemap is inlined into the CSS files.

In order to have your styles extracted, you'll also need to use **MiniCssExtractPlugin**. To do that, you can add the following snippet in your webpack config:

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

This will extract the CSS from all files into a single `styles.css`. Then you need to include this file in your HTML file.
