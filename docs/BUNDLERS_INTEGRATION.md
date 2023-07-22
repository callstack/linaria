# Bundlers Integration

## Jump To

- [webpack](#webpack)
- [esbuild](#esbuild)
- [Rollup](#Rollup)
- [Vite](#Vite)
- [Svelte](#Svelte)

## Pre-requisites

If you use Babel in your project, make sure to have a [config file for Babel](https://babeljs.io/docs/en/config-files) in your project root with the plugins and presets you use. Otherwise Linaria won't be able to parse the code.

## Bundlers

Please note, that `@babel/core` is a peer dependency of all loaders. Do not forget to add it to `devDependencies` list in your project.

### webpack

To use Linaria with webpack, in your webpack config, add `@linaria/webpack-loader` under `module.rules`:

```js
{
  test: /\.js$/,
  use: [
    { loader: 'babel-loader' },
    {
      loader: '@linaria/webpack-loader',
      options: {
        sourceMap: process.env.NODE_ENV !== 'production',
      },
    }
  ],
}
```

Make sure that `@linaria/webpack-loader` is included after `babel-loader`.

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
    {
      loader: MiniCssExtractPlugin.loader,
    },
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

This will extract the CSS from all files into a single `styles.css`. Then you can link to this file in your HTML file manually or use something like [`HTMLWebpackPlugin`](https://github.com/jantimon/html-webpack-plugin).

It will also hot reload your styles when in a development environment.

For production usage, you should include a hash in the filename:

```js
new MiniCssExtractPlugin({
  filename: 'styles-[contenthash].css',
});
```

Using a hash like this allows for a far future `Expires` header to be used, to improve cache efficiency. To link to the correct filename, you can either use [`HTMLWebpackPlugin`](https://github.com/jantimon/html-webpack-plugin) for a static HTML file, or [`assets-webpack-plugin`](https://yarn.pm/assets-webpack-plugin) to save the filename to a JSON file which you can then read in your server-side code.

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
            loader: '@linaria/webpack-loader',
            options: { sourceMap: dev },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
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
yarn add --dev webpack webpack-cli webpack-dev-server mini-css-extract-plugin css-loader file-loader babel-loader @linaria/webpack-loader
```

You can now run the dev server by running `webpack-dev-server` and build the files by running `webpack`.

#### Options

The loader accepts the following options:

- `sourceMap: boolean` (default: `false`):

  Setting this option to `true` will include source maps for the generated CSS so that you can see where source of the class name in devtools. We recommend to enable this only in development mode because the sourcemap is inlined into the CSS files.

- `cacheProvider: undefined | string | ICache` (default: `undefined`):
  By default Linaria use a memory cache to store temporary CSS files. But if you are using this loader with [thread-loader](https://www.npmjs.com/package/thread-loader) you should use some consistent cache to prevent [some unexpected issues](https://github.com/callstack/linaria/issues/881). This options support a `ICache` instance or a path to NodeJS module which export a `ICache` instance as `module.exports`

  > ```
  > interface ICache {
  >   get: (key: string) => Promise<string>;
  >   set: (key: string, value: string) => Promise<void>;
  >   getDependencies?: (key: string) => Promise<string[]>;
  >   setDependencies?: (key: string, value: string[]) => Promise<void>;
  > }
  > ```

  When running webpack with `--watch`, `getDependencies` and `setDependencies` will be used to carry dependencies of the Linaria JavaScript source to the generated css output, ensuring both are rebuilt when dependencies change. When these methods are not present on the cache instance, dependencies for the css output will be ignored and may get out of sync with the JavaScript output. Linaria's default memory cache does not have this issue.

- `extension: string` (default: `'.linaria.css'`):

  An extension of the intermediate CSS files.

- `preprocessor: 'none' | 'stylis' | Function` (default: `'stylis'`)

  You can override the pre-processor if you want to override how the loader processes the CSS.

  - `'none'`: This will disable pre-processing entirely and the CSS will be left as you wrote it.

    You might want to do it if you want to use non-standard syntax such as Sass or custom [postcss](https://postcss.org/) syntax. Features such as nesting will no longer work with this option. You need to specify a loader such as [`sass-loader`](https://github.com/webpack-contrib/sass-loader) for `.linaria.css` files which handles the syntax you wrote.

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
  loader: '@linaria/webpack-loader',
  options: {
    sourceMap: false,
  },
}
```

### esbuild

To use Linaria with esbuild, you don't need to install any external package since esbuild handles CSS by itself:

```sh
yarn add --dev @linaria/esbuild
```

Then add it to your esbuild config:

```js
import linaria from '@linaria/esbuild';
import esbuild from 'esbuild';

const prod = process.env.NODE_ENV === 'production';

esbuild
  .build({
    entryPoints: ['src/index.ts'],
    outdir: 'dist',
    bundle: true,
    minify: prod,
    plugins: [
      linaria({
        sourceMap: prod,
      }),
    ],
  })
  .catch(() => process.exit(1));
```

### Rollup

To use Linaria with Rollup, you need to use it together with a plugin which handles CSS files, such as `rollup-plugin-css-only`:

```sh
yarn add --dev rollup-plugin-css-only @linaria/rollup
```

Then add them to your `rollup.config.js`:

```js
import linaria from '@linaria/rollup';
import css from 'rollup-plugin-css-only';

export default {
  plugins: [
    linaria({
      sourceMap: process.env.NODE_ENV !== 'production',
    }),
    css({
      output: 'styles.css',
    }),
  ],
};
```

If you are using [@rollup/plugin-babel](https://github.com/rollup/plugins/tree/master/packages/babel) as well, ensure the linaria plugin is declared earlier in the `plugins` array than your babel plugin.

```js
import linaria from '@linaria/rollup';
import css from 'rollup-plugin-css-only';
import babel from '@rollup/plugin-babel';

export default {
  plugins: [
    linaria({
      sourceMap: process.env.NODE_ENV !== 'production',
    }),
    css({
      output: 'styles.css',
    }),
    babel({}),
    /* rest of your plugins */
  ],
};
```

### Vite

~~Since Vite supports Rollup plugin~~ Since Vite provides more features and flexibility, Linaria has a separate plugin for it `@linaria/vite`. Vite handles CSS by itself, you don't need a css plugin.

```sh
yarn add --dev @linaria/vite
```

Then add them to your `vite.config.js`:

```js
import { defineConfig } from 'vite';
import linaria from '@linaria/vite';

export default defineConfig(() => ({
  // ...
  plugins: [linaria()],
}));
```

If you are using language features that requires a babel transform (such as typescript), ensure the proper babel presets or plugins are passed to linaria.

```js
import { defineConfig } from 'vite';
import linaria from '@linaria/vite';

// example to support typescript syntax:
export default defineConfig(() => ({
  // ...
  plugins: [
    linaria({
      include: ['**/*.{ts,tsx}'],
      babelOptions: {
        presets: ['@babel/preset-typescript', '@babel/preset-react'],
      },
    }),
  ],
}));
```

### Svelte

#### Contents

- [Svelte with Rollup](#Rollup-1)
- [Svelte with Webpack](#Webpack-1)

#### Rollup

Take a look: [d964432](https://github.com/madhavarshney/svelte-linaria-sample/commit/d96443218694c0c8d80edf7c40a8fbf7c1f6997f)

Install `rollup-plugin-css-only` and update `rollup.config.js`

```js
import svelte from 'rollup-plugin-svelte';
import css from 'rollup-plugin-css-only'; // for CSS bundling
import linaria from '@linaria/rollup';

const dev = process.env.NODE_ENV !== 'production';

export default {
  ...
  plugins: [
    svelte({
      dev,
      // allow `plugin-css-only` to bundle with CSS generated by linaria
      emitCss: true,
    }),
    linaria({
      sourceMap: dev,
    }),
    css({
      output: '<OUT_FOLDER>/bundle.css',
    }),
  ],
};
```

**IMPORTANT**: `rollup-plugin-css-only` generates incorrect sourcemaps (see [thgh/rollup-plugin-css-only#10](https://github.com/thgh/rollup-plugin-css-only/issues/10)). Use an alternative CSS plugin such as [`rollup-plugin-postcss`](https://github.com/egoist/rollup-plugin-postcss) instead in the same way as above.

#### Webpack

Take a look: [5ffd69d](https://github.com/madhavarshney/svelte-linaria-sample/commit/5ffd69dc9f9584e3eec4127e798d7a4c1552ec19)

Update `webpack.config.js` with the following:

```js
const prod = process.env.NODE_ENV === 'production';

const linariaLoader = {
  loader: '@linaria/webpack-loader',
  options: {
    sourceMap: !prod,
  },
};

module.exports = {
  ...
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: [linariaLoader],
      },
      {
        test: /\.svelte$/,
        use: [
          linariaLoader,
          {
            loader: 'svelte-loader',
            options: {
              dev: !prod,
              emitCss: true,
              hotReload: true,
            },
          },
        ],
      },
      ...(CSS rules)
    ],
  },
};
```
