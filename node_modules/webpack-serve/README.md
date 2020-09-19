<div align="center">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200" src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
</div>

[![npm][npm]][npm-url]
[![node][node]][node-url]
[![deps][deps]][deps-url]
[![tests][tests]][tests-url]
[![coverage][cover]][cover-url]
[![chat][chat]][chat-url]
[![size][size]][size-url]

# webpack-serve

For a novel, fast(er), and superior development server - try [webpack-plugin-serve](https://www.npmjs.com/package/webpack-plugin-serve)

> Note: webpack-serve is now being maintained on [this fork](https://github.com/shellscape/webpack-serve), and will be open to Pull Requests and Issues for users that prefer this dev server. The webpack-contrib org has chosen to drop support for this module and is no longer actively maintaining it.

A lean, modern, and flexible webpack development server

## Requirements

This module requires a minimum of Node.js v6.9.0 and Webpack v4.0.0.

## Browser Support

Because this module leverages _native_ `WebSockets` via `webpack-hot-client`,
the browser support for this module is limited to only those browsers which
support native `WebSocket`. That typically means the last two major versions
of a particular browser. You may view a table of
[compatible browsers here](https://caniuse.com/#feat=websockets).

_Note: We won't be accepting requests for changes to this facet of the module._

## Getting Started

To begin, you'll need to install `webpack-serve`:

```console
$ npm install webpack-serve --save-dev
```

## CLI

```console
$ webpack-serve --help

A lean, modern, and flexible webpack development server

Usage
  $ webpack-serve <config> [...options]

Options
  --clipboard      Specify whether or not the server should copy the server URI to the clipboard (default: true)
  --config         The webpack config to serve. Alias for <config>
  --content        The path from which static content will be served (default: process.cwd)
  --dev-ware       Set options for webpack-dev-middleware. e.g. --dev-ware.publicPath /
  --help           Show usage information and the options listed here.
  --host           The host the app should bind to
  --hot-client     Set options for webpack-hot-client. e.g. --hot-client.host localhost
                   Use --no-hot-client to disable webpack-hot-client
  --http2          Instruct the server to use HTTP2
  --https-cert     Specify a filesystem path of an SSL certificate. Must be paired with a key
  --https-key      Specify a filesystem path of an SSL key. Must be paired with a cert
  --https-pass     Specify a passphrase to enable https. Must be paired with a pfx file
  --https-pfx      Specify a filesystem path of an SSL pfx file. Must be paired with a passphrase
  --log-level      Limit all process console messages to a specific level and above
                   Levels: trace, debug, info, warn, error, silent
  --log-time       Instruct the logger for webpack-serve and dependencies to display a timestamp
  --hmr            Specify whether or not the client should apply Hot Module Replacement patches (default: true)
  --reload         Specify whether or not the middleware should reload the page for build errors (default: true)
  --open           Instruct the app to open in the default browser
  --open-app       The name of the app to open the app within, or an array
                   containing the app name and arguments for the app
  --open-path      The path with the app a browser should open to
  --port           The port the app should listen on. Default: 8080
  --require, -r    Preload one or more modules before loading the webpack configuration
  --version        Display the webpack-serve version

Note: Any boolean flag can be prefixed with 'no-' instead of specifying a value.
e.g. --no-reload rather than --reload=false

Examples
  $ webpack-serve ./webpack.config.js --no-reload
  $ webpack-serve --config ./webpack.config.js --port 1337
  $ webpack-serve # config can be omitted for webpack v4+ only
```

_Note: The CLI will use your local install of webpack-serve when available,
even when run globally._

### Running the CLI

There are a few variations for using the base CLI command, and starting
`webpack-serve`:

```console
$ webpack-serve ./webpack.config.js
$ webpack-serve --config ./webpack.config.js
```

Those two commands are synonymous. Both instruct `webpack-serve` to load the
config from the specified path. We left the flag in there because some folks
like to be verbose, so why not.

```console
$ webpack-serve
```

You may also instruct `webpack-serve` to kick off a webpack build without
specifying a config. This will apply the zero-config defaults within webpack,
and your project must conform to that for a successful build to happen.

## `webpack-serve` Config

You can store and define configuration / options for `webpack-serve` in a number
of different ways. This module leverages
[cosmiconfig](https://github.com/davidtheclark/cosmiconfig), which allows you to
define `webpack-serve` options in the following ways:

- in your package.json file in a `serve` property
- in a `.serverc` or `.serverc.json` file, in either JSON or YML.
- in a `serve.config.js` file which exports a CommonJS module (just like webpack).

It's most common to keep `serve` options in your `webpack.config.js` (see below),
however, you can utilize any of the options above _in tandem_ with
`webpack.config.js`, and the options from the two sources will be merged. This
can be useful for setups with multiple configs that share common options for
`webpack-serve`, but require subtle differences.

### `webpack.config.js` Example

```js
const path = require('path');

module.exports = {
  context: __dirname,
  devtool: 'source-map',
  entry: ['./app.js'],
  output: {
    filename: './output.js',
    path: path.resolve(__dirname),
  },
  serve: {},
};
```

### Webpack Config `serve` Property

`webpack-serve` supports the `serve` property in your webpack config file, which
may contain any of the supported [options](#options).

### Setting the Config `mode`

Should you find that the `mode` property of your webpack config file needs to be
set dynamically the following pattern can be used:

```json
mode: process.env.WEBPACK_SERVE ? 'development' : 'production',
```

## API

When using the API directly, the main entry point  is the `serve` function, which
is the default export of the module.

```js
const serve = require('webpack-serve');
const argv = {};
const config = require('./webpack.config.js');

serve(argv, { config }).then((result) => {
  // ...
});
```

## `serve(argv, options)`

Returns: `Promise`  
Resolves: `<Object> result`

### `result.app`

Type: `Koa`

An instance of a `Koa` application, extended with a `server` property, and
`stop` method, which is used to programatically stop the server.

### `result.on`

Type: `Function`

A function which binds a serve event-name to a function. See [Events](#events).

### `result.options`

Type: `Object`

Access to a frozen copy of the internal `options` object used by the module.

### `argv`

Type: `Object`  
_Required_

An object containing the parsed result from either
[`minimist`](https://github.com/substack/minimist) or
[`yargs-parser`](https://github.com/yargs/yargs-parser).

### `options`

Type: `Object`  
_Required_

An object specifying options used to configure the server.

### `options.add`

Please see [Add-On Features](#add-on-features).

### `options.compiler`

Type: `webpack`  
Default: `null`

An instance of a `webpack` compiler. A passed compiler's config will take
precedence over `config` passed in options.

_Note: Any `serve` configuration must be removed from the webpack config used
to create the compiler instance, before you attempt to create it, as it's not
a valid webpack config property._

### `options.config`

Type: `Object`  
Default: `{}`

An object containing the configuration for creating a new `webpack` compiler
instance.

### `options.content`

Type: `String|[String]`  
Default: `process.cwd()`

The path, or array of paths, from which content will be served. Paths specified
here should be absolute, or fully-qualified and resolvable by the filesystem.

_Note: By default the files generated by webpack take precedence
over static files served from `content` paths._
 
To instruct the server to give static files precedence, use the `add`
option, and call `middleware.content()` before `middleware.webpack()`:

```js
add: (app, middleware, options) => {
  middleware.content();
  middleware.webpack();
};
```
 
 Read more about the add option in [Add-On Features](#add-on-features).

<!-- intentionally out of alphabetic order -->
### `options.clipboard`

Type: `Boolean`  
Default: `true`

If true, the server will copy the server URI to the clipboard when the server is
started.

### `options.devMiddleware`

Type: `Object`  
Default: `{ publicPath: '/' }`

An object containing options for [webpack-dev-middleware][dev-ware].

### `options.host`

Type: `String`  
Default: `'localhost'`

Sets the host that the server will listen on. eg. `'10.10.10.1'`

_Note: This value must match any value specified for `hot.host` or
`hot.host.server`, otherwise `webpack-serve` will throw an error. This
requirement ensures that the `koa` server and `WebSocket` server play nice
together._

### `options.hotClient`

Type: `Object|Boolean`  
Default: `{}`

An object containing options for [webpack-hot-client][hot-client].
Setting this to `false` will completely disable `webpack-hot-client`
and all automatic Hot Module Replacement functionality.

### `options.http2`

Type: `Boolean`  
Default: `false`

If using Node v9 or greater, setting this option to `true` will enable HTTP2
support.

### `options.https`

Type: `Object`  
Default: `null`

Passing this option will instruct `webpack-serve` to create and serve the webpack
bundle and accompanying content through a secure server. The object should
contain properties matching:

```js
{
  key: fs.readFileSync('...key'),   // Private keys in PEM format.
  cert: fs.readFileSync('...cert'), // Cert chains in PEM format.
  pfx: <String>,                    // PFX or PKCS12 encoded private key and certificate chain.
  passphrase: <String>              // A shared passphrase used for a single private key and/or a PFX.
}
```

See the [Node documentation][https-opts] for more information. For SSL
Certificate generation, please read the
[SSL Certificates for HTTPS](#ssl-certificates-for-https) section.

### `options.logLevel`

Type: `String`  
Default: `info`

Instructs `webpack-serve` to output information to the console/terminal at levels
higher than the specified level. Valid levels:

```js
[
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'silent'
]
```

### `options.logTime`

Type: `Boolean`  
Default: `false`

Instruct `webpack-serve` to prepend each line of log output with a `[HH:mm:ss]`
timestamp.

### `options.on`

Type: `Object`  
Default: `null`

While running `webpack-serve` from the command line, it can sometimes be useful
to subscribe to events from the module's event bus _within your config_. This
option can be used for that purpose. The option's value must be an `Object`
matching a `key:handler`, `String: Function` pattern. eg:

```js
on: {
  'build-started': () => { console.log('build started!'); }
}
```

### `open`

Type: `Boolean|Object`  
Default: `false`

Instruct the module to open the served bundle in a browser. Accepts an `Object`
that matches:

```js
{
  app: <String>, // The proper name of the browser app to open.
  path: <String> // The url path on the server to open.
}
```

_Note: Using the `open` option will disable the `clipboard` option._

### `port`

Type: `Number`  
Default: `8080`

The port the server should listen on.

## Events

The server created by `webpack-serve` emits select events which can be
subscribed to. All events are emitted with a single `Object` parameter,
containing named properties for relevant data.

For example:

```js
const serve = require('webpack-serve');
const argv = {};
const config = require('./webpack.config.js');

serve(argv, { config }).then((server) => {
  server.on('listening', ({ server, options }) => {
    console.log('happy fun time');
  });
});
```

#### build-started

<!-- spaces before Arguments are a unicode em-space " " -->

Arguments:  
 [`Compiler`](https://webpack.js.org/api/node/#compiler-instance) _compiler_

Emitted when a compiler has started a build.

#### build-finished

Arguments:  
 [`Stats`](https://webpack.js.org/api/node/#stats-object) _stats_  
 [`Compiler`](https://webpack.js.org/api/node/#compiler-instance) _compiler_

Emitted when a compiler has finished a build.

#### compiler-error

Arguments:  
 [`Stats`](https://webpack.js.org/api/node/#stats-tojson-options-) _json_  
 [`Compiler`](https://webpack.js.org/api/node/#compiler-instance) _compiler_

Emitted when a compiler has encountered and error, or a build has errors.

#### compiler-warning

Arguments:  
 [`Stats`](https://webpack.js.org/api/node/#stats-tojson-options-) _json_  
 [`Compiler`](https://webpack.js.org/api/node/#compiler-instance) _compiler_

Emitted when a compiler has encountered a warning, or a build has warnings.

#### listening

Arguments:  
 [`net.Server`](https://nodejs.org/api/net.html#net_class_net_server)  
 `Object` options

Emitted when the server begins listening for connections.

## SSL Certificates for HTTPS

Unlike webpack-dev-server, `webpack-serve` does not ship with SSL Certificate
generation, nor does it ship with a built-in certificate for use with HTTPS
configurations. This is due largely in part to past security concerns and the
complexity of use-cases in the webpack ecosystem.

We do however, recommend a path for users to generate their own SSL Certificates
safely and efficiently. That path resides in
[`devcert-cli`](https://github.com/davewasmer/devcert-cli); an excellent project
that automates the creation of trusted SSL certificates that will work
wonderfully with `webpack-serve`.

## Add-on Features

A core tenet of `webpack-serve` is to stay lean in terms of feature set, and to
empower users with familiar and easily portable patterns to implement the same
features that those familiar with `webpack-dev-server` have come to rely on. This
makes the module far easier to maintain, which ultimately benefits the user.

Luckily, flexibility baked into `webpack-serve` makes it a snap to add-on features.
You can leverage this by using the `add` option. The value of the option should
be a `Function` matching the following signature:

```js
add: (app, middleware, options) => {
  // ...
}
```

### `add` Function Parameters

- `app` The underlying Koa app
- `middleware` An object containing accessor functions to call both
`webpack-dev-middleware` and the `koa-static` middleware.
- `options` - The internal options object used by `webpack-serve`

Some add-on patterns may require changing the order of middleware used in the
`app`. For instance, if adding routes or using a separate router with the `app`
where routes must be added last, you'll need to call the `middleware` functions
early on. `webpack-serve` recognizes these calls and will not execute them again.
If these calls were omitted, `webpack-serve` would execute both in the default,
last in line, order.

```js
add: (app, middleware, options) => {
  // since we're manipulating the order of middleware added, we need to handle
  // adding these two internal middleware functions.
  middleware.webpack();
  middleware.content();

  // router *must* be the last middleware added
  app.use(router.routes());
}
```

Listed below are some of the add-on patterns and recipes that can be found in
[docs/addons](docs/addons):

- [bonjour](docs/addons/bonjour.config.js)
- [compress](docs/addons/compress)
- [historyApiFallback](docs/addons/history-fallback.config.js)
- [proxy + history fallback](docs/addons/proxy-history-fallback.config.js)
- [proxy + router](docs/addons/proxy-router.config.js)
- [reuse Chrome tab](docs/addons/reuse-chrome-tab)
- [staticOptions](docs/addons/static-content-options.config.js)
- [useLocalIp](docs/addons/local-ip.config.js)
- [watch content](docs/addons/watch-content.config.js)

### Community Add-ons

_Note: The list below contains `webpack-serve` add-ons created by the community.
Inclusion in the list does not imply a module is preferred or recommended
over others._

- [webpack-serve-waitpage](https://github.com/elisherer/webpack-serve-waitpage):
Provides build progress in the client during complilation.
- [webpack-serve-overlay](https://github.com/G-Rath/webpack-serve-overlay):
Provides an error and warning information overlay in the client.

## Contributing

We welcome your contributions! Please take a moment to read our contributing
guidelines if you haven't yet done so.

#### [CONTRIBUTING](./.github/CONTRIBUTING.md)

## License

#### [MIT](./LICENSE)

[npm]: https://img.shields.io/npm/v/webpack-serve.svg
[npm-url]: https://npmjs.com/package/webpack-serve

[node]: https://img.shields.io/node/v/webpack-serve.svg
[node-url]: https://nodejs.org

[deps]: https://david-dm.org/shellscape/webpack-serve.svg
[deps-url]: https://david-dm.org/shellscape/webpack-serve

[tests]: 	https://img.shields.io/circleci/project/github/shellscape/webpack-serve.svg
[tests-url]: https://circleci.com/gh/shellscape/webpack-serve

[cover]: https://codecov.io/gh/shellscape/webpack-serve/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/shellscape/webpack-serve

[chat]: https://img.shields.io/badge/gitter-webpack%2Fwebpack-brightgreen.svg
[chat-url]: https://gitter.im/webpack/webpack

[size]: https://packagephobia.now.sh/badge?p=webpack-serve
[size-url]: https://packagephobia.now.sh/result?p=webpack-serve

[dev-ware]: https://github.com/webpack/webpack-dev-middleware#options
[hot-client]: https://github.com/shellscape/webpack-hot-client#options
[https-opts]: https://nodejs.org/api/tls.html#tls_tls_createsecurecontext_options