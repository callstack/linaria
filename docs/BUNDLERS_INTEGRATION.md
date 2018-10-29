# Bundlers Integration

## Pre-requisites

If you use Babel in your project, make sure to have a [config file for Babel](https://babeljs.io/docs/en/config-files) in your project root with the plugins and presets you use. Otherwise Linaria won't be able to parse the code.

## Bundlers

### webpack

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

Make sure that `linaria/loader` is included after `babel-loader`.

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

#### Options

The loader accepts the following options:

- `sourceMap: boolean` (default: `false`) - Setting this option to `true` will include source maps for the generated CSS so that you can see where source of the class name in devtools. We recommend to enable this only in development mode because the sourcemap is inlined into the CSS files.
- `cacheDirectory: string` (default: `'.linaria-cache'`) - Path to the directory where the loader will output the intermediate CSS files. You can pass a relative or absolute directory path. Make sure the directory is inside the working directory for things to work properly. **You should add this directory to `.gitignore` so you don't accidentally commit them.**

In addition to the above options, the loader also accepts all the options accepted by the [babel preset](/docs/BABEL_PRESET.md).

You can pass options to the loader like so:

```js
{
  loader: 'linaria/loader',
  options: {
    sourceMap: false,
    cacheDirectory: '.linaria-cache',
  },
}
```

### Rollup

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
      sourceMap: process.env.NODE_ENV !== 'production',
    }),
    css({
      output: 'styles.css',
    }),
  ],
};
```
