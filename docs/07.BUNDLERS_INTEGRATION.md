---
title: Bundlers integrations
link: bundlers-integration
---

# Bundlers Integration

## Pre-requisites

If you use Babel in your project, make sure to have a [config file for Babel](https://babeljs.io/docs/en/config-files) in your project root with the plugins and presets you use. Otherwise Linaria won't be able to parse the code.

## Bundlers

### webpack

To use Linaria wih webpack, in your webpack config, add `linaria/loader` under `module.rules`:

```js
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
}
```

Make sure that `linaria/loader` is included after `babel-loader`.

In order to have your styles extracted, you'll also need to use **css-loader** and **MiniCssExtractPlugin**. First, install them:

```sh
yarn add --dev css-loader mini-css-extract-plugin
```

Import `mini-css-extract-plugin` at the top of your webpack config:

```js
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
```

Now add the following snippet in under `module.rules`:

```js
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
```

Then add the following under `plugins`:

```js
new MiniCssExtractPlugin({
  filename: 'styles.css',
});
```

This will extract the CSS from all files into a single `styles.css`. Then you can to link to this file in your HTML file manually or use something like [`HTMLWebpackPlugin`](https://github.com/jantimon/html-webpack-plugin).

If you want to hot reload your styles when they change, you will also need to configure [`style-loader`](https://github.com/webpack-contrib/style-loader) or [`css-hot-loader`](https://github.com/shepherdwind/css-hot-loader).

Linaria integrates with your CSS pipeline, so you can always perform additional operations on the CSS, for example, using [postcss](https://postcss.org/) plugins such as [clean-css](https://github.com/jakubpawlowicz/clean-css) to further minify your CSS.

#### Full example

Here is an example webpack config with Linaria:

```js
const webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const dev = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: dev ? 'development' : 'production',
  devtool: 'source-map',
  entry: {
    app: './src/index',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/',
    filename: '[name].bundle.js',
  },
  optimization: {
    noEmitOnErrors: true,
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': { NODE_ENV: JSON.stringify(process.env.NODE_ENV) },
    }),
    new MiniCssExtractPlugin({ filename: 'styles.css' }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          { loader: 'babel-loader' },
          {
            loader: 'linaria/loader',
            options: { sourceMap: dev },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          'css-hot-loader',
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: { sourceMap: dev },
          },
        ],
      },
      {
        test: /\.(jpg|png|gif|woff|woff2|eot|ttf|svg)$/,
        use: [{ loader: 'file-loader' }],
      },
    ],
  },
  devServer: {
    contentBase: [path.join(__dirname, 'public')],
    historyApiFallback: true,
  },
};
```

You can copy this file to your project if you are starting from scratch.

To install the dependencies used in the example config, run:

```sh
yarn add --dev webpack webpack-cli webpack-dev-server mini-css-extract-plugin css-loader css-hot-loader file-loader babel-loader
```

You can now run the dev server by running `webpack-dev-server` and build the files by running `webpack`.

#### Options

The loader accepts the following options:

- `sourceMap: boolean` (default: `false`):

  Setting this option to `true` will include source maps for the generated CSS so that you can see where source of the class name in devtools. We recommend to enable this only in development mode because the sourcemap is inlined into the CSS files.

- `cacheDirectory: string` (default: `'.linaria-cache'`):

  Path to the directory where the loader will output the intermediate CSS files. You can pass a relative or absolute directory path. Make sure the directory is inside the working directory for things to work properly. **You should add this directory to `.gitignore` so you don't accidentally commit them.**

- `preprocessor: 'none' | 'stylis' | Function` (default: `'stylis'`)

  You can override the pre-processor if you want to override how the loader processes the CSS.

  - `'none'`: This will disable pre-processing entirely and the CSS will be left as you wrote it.

    You might want to do it if you want to use non-standard syntax such as Sass or custom [postcss](https://postcss.org/) syntax Features such as nesting will no longer work with this option. You need to specify a loader such as [`sass-loader`](https://github.com/webpack-contrib/sass-loader) for `.linaria.css` files which handles the syntax you wrote.

  - `'stylis'`: This is the default pre-processor using [stylis.js](https://github.com/thysultan/stylis.js).

    This option also applies a custom `stylis` plugin to correct the relative paths inside `url(...)` expressions so that `css-loader` can resolve them properly.

  - `Function`: You can pass a custom function which receives the `selector` and `cssText` strings. It should return the resulting CSS code.

    A very basic implementation may look like this: `` (selector, cssText) => `${selector} { ${cssText} }`; ``.

  Changing the `preprocessor` doesn't affect the following operations:

  - The class names are always generated by the library and the pre-processor cannot change it.
  - Dynamic interpolations are always replaced with CSS variables.
  - Interpolations for JS objects always generate syntax used by default.

  Note that if you use a custom syntax, you also need to specify the `syntax` in your `stylelint.config.js` to properly lint the CSS.

In addition to the above options, the loader also accepts all the options supported in the [configuration file](/docs/CONFIGURATION.md).

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
