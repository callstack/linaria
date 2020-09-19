[tests]: 	https://img.shields.io/circleci/project/github/shellscape/koa-webpack.svg
[tests-url]: https://circleci.com/gh/shellscape/koa-webpack

[cover]: https://codecov.io/gh/shellscape/koa-webpack/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/shellscape/koa-webpack

[size]: https://packagephobia.now.sh/badge?p=koa-webpack
[size-url]: https://packagephobia.now.sh/result?p=koa-webpack

# koa-webpack

[![tests][tests]][tests-url]
[![cover][cover]][cover-url]
[![size][size]][size-url]

Development and Hot Module Reload Middleware for **Koa2**, in a single
middleware module.

This module wraps and composes
[`webpack-dev-middleware`](https://github.com/webpack/webpack-dev-middleware) and
[`webpack-hot-client`](https://github.com/shellscape/webpack-hot-client)
into a single middleware module, allowing for quick and concise implementation.

As an added bonus, it'll also use the installed `webpack` module from your project,
and the `webpack.config.js` file in the root of your project, automagically, should
you choose to let it. This negates the need for all of the repetitive setup and
config that you get with `koa-webpack-middleware`.

## Install

Using npm:

```console
npm install koa-webpack --save-dev
```

<a href="https://www.patreon.com/shellscape">
  <img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>

## Requirements

`koa-webpack` is an evergreen module. 🌲 This module requires an [Active LTS](https://github.com/nodejs/Release) Node version (v8.0.0+ or v10.0.0+), and Webpack v4.0.0+.

## Usage

```js
const Koa = require('koa');
const koaWebpack = require('koa-webpack');

const app = new Koa();
const options = { .. };
const middleware = await koaWebpack(options);

app.use(middleware);
```

## API

### koaWebpack([options])

Returns a `Promise` which resolves the server `middleware` containing the
following additional properties:

- `close(callback)` *(Function)* - Closes both the instance of `webpack-dev-middleware`
and `webpack-hot-client`. Accepts a single `Function` callback parameter that is
executed when complete.
- `hotClient` *(Object)* - An instance of `webpack-hot-client`.
- `devMiddleware` *(Object)* - An instance of `webpack-dev-middleware`

## Options

The middleware accepts an `options` Object, which can contain options for the
`webpack-dev-middleware` and `webpack-hot-client` bundled with this module.
The following is a property reference for the Object:

### compiler

Type: `Object`  
`optional`

Should you rather that the middleware use an instance of `webpack` that you've
already init'd [with webpack config], you can pass it to the middleware using
this option.

Example:

```js
const webpack = require('webpack');
const config = require('./webpack.config.js');
const koaWebpack = require('koa-webpack');

const compiler = webpack(config);
const middleware = await koaWebpack({ compiler });

app.use(middleware);
```

### config

Type: `Object`

Should you rather that the middleware use an instance of webpack configuration
that you've already required/imported, you can pass it to the middleware using
this option.

Example:

```js
const koaWebpack = require('koa-webpack');
const config = require('./webpack.config.js');

const middleware = await koaWebpack({ config });

app.use(middleware);
```

### configPath

Type: `String`

Allows you to specify the absolute path to the Webpack config file to be used.

Example:

```js
const path = require('path');
const koaWebpack = require('koa-webpack');

// The Webpack config file would be at "./client/webpack.config.js".
const middleware = await koaWebpack({
  configPath: path.join(__dirname, 'client', 'webpack.config.js')
});

app.use(middleware);
```

### devMiddleware

Type: `Object`

The `devMiddleware` property should contain options for `webpack-dev-middleware`, a list of
which is available at [webpack-dev-middleware](https://github.com/webpack/webpack-dev-middleware).
Omitting this property will result in `webpack-dev-middleware` using its default
options.

### hotClient

Type: `Object|Boolean`

The `hotClient` property should contain options for `webpack-hot-client`, a list of
which is available at [webpack-hot-client](https://github.com/webpack-contrib/webpack-hot-client).
Omitting this property will result in `webpack-hot-client` using its default
options.

As of `v3.0.1` setting this to `false` will completely disable `webpack-hot-client`
and all automatic Hot Module Replacement functionality.

## Using with koa-compress

When using `koa-webpack` with [koa-compress](https://github.com/koajs/compress),
you may experience issues with saving files and hot module reload. Please review
[this issue](https://github.com/shellscape/koa-webpack/issues/36#issuecomment-289565573)
for more information and a workaround.

## Server-Side-Rendering

When `serverSideRender` is set to true in `config.devMiddleware`, `webpackStats` is
accessible from `ctx.state.webpackStats`.

```js
app.use(async (ctx, next) => {
  const assetsByChunkName = ctx.state.webpackStats.toJson().assetsByChunkName;
  // do something with assetsByChunkName
})
```

For more details please refer to:
[webpack-dev-middleware](https://github.com/webpack/webpack-dev-middleware#server-side-rendering)


## Using with html-webpack-plugin

When using with html-webpack-plugin, you can access dev-middleware in-memory filesystem to serve index.html file:

```js
const middleware = await koaWebpack({ config });

app.use(middleware);

app.use(async (ctx) => {
  const filename = path.resolve(webpackConfig.output.path, 'index.html')
  ctx.response.type = 'html'
  ctx.response.body = middleware.devMiddleware.fileSystem.createReadStream(filename)
});
```

## Contributing

Please take a moment to read our contributing guidelines if you haven't yet done so.

#### [CONTRIBUTING](./.github/CONTRIBUTING.md)

## Attribution

This module started as a fork of
[`koa-webpack-middleware`](https://github.com/leecade/koa-webpack-middleware)

## License

#### [MPL](./LICENSE)
