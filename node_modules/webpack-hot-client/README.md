<div align="center">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200" src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
</div>

[![npm][npm]][npm-url]
[![node][node]][node-url]
[![deps][deps]][deps-url]
[![tests][tests]][tests-url]
[![chat][chat]][chat-url]
[![size][size]][size-url]

# webpack-hot-client

A client for enabling, and interacting with, webpack [Hot Module Replacement][hmr-docs].

This is intended to work in concert with [`webpack-dev-middleware`][dev-middleware]
and allows for adding Hot Module Replacement to an existing server, without a
dependency upon [`webpack-dev-server`][dev-server]. This comes in handy for testing
in projects that already use server frameworks such as `Express` or `Koa`.

`webpack-hot-client` accomplishes this by creating a `WebSocket` server, providing
the necessary client (browser) scripts that communicate via `WebSocket`s, and
automagically adding the necessary webpack plugins and config entries. All of
that allows for a seamless integration of Hot Module Replacement Support.

Curious about the differences between this module and `webpack-hot-middleware`?
[Read more here](https://github.com/webpack-contrib/webpack-hot-client/issues/18).

## Requirements

This module requires a minimum of Node v6.9.0 and Webpack v4.0.0.

## Getting Started

To begin, you'll need to install `webpack-hot-client`:

```console
$ npm install webpack-hot-client --save-dev
```

## Gotchas

### Entries

In order to use `webpack-hot-client`, your `webpack` config should include an
`entry` option that is set to an `Array` of `String`, or an `Object` who's keys
are set to an `Array` of `String`. You may also use a `Function`, but that
function should return a value in one of the two valid formats.

This is primarily due to restrictions in `webpack` itself and the way that it
processes options and entries. For users of webpack v4+ that go the zero-config
route, you must specify an `entry` option.

### Automagical Configuration

As a convenience `webpack-hot-client` adds `HotModuleReplacementPlugin`
and the necessary entries to your `webpack` config for you at runtime. Including
the plugin in your config manually while using this module may produce unexpected
or wonky results. If you have a need to configure entries and plugins for HMR
manually, use the `autoConfigure` option.

### Best Practices

When using this module manually, along with the default `port` option value of
`0`, starting compilation (or passing a compiler to `webpack-dev-middleware`)
should be done _after_ the socket server has finished listening and allocating
a port. This ensures that the build will contain the allocated port. (See the
Express example below.) This condition does not apply if providing a static
`port` option to the API.

### Express

For setting up the module for use with an `Express` server, try the following:

```js
const hotClient = require('webpack-hot-client');
const middleware = require('webpack-dev-middleware');
const webpack = require('webpack');
const config = require('./webpack.config');

const compiler = webpack(config);
const { publicPath } = config.output;
const options = { ... }; // webpack-hot-client options

// we recommend calling the client _before_ adding the dev middleware
const client = hotClient(compiler, options);
const { server } = client;

server.on('listening', () => {
  app.use(middleware(compiler, { publicPath }));
});
```

### Koa

Since `Koa`@2.0.0 was released, the patterns and requirements for using
`webpack-dev-middleware` have changed somewhat, due to use of `async/await` in
Koa. As such, one potential solution is to use [`koa-webpack`][koa-webpack],
which wires up the dev middleware properly for Koa, and also implements this
module. If you'd like to use both modules without `koa-webpack`, you may examine
that module's code for implementation details.

## Browser Support

Because this module leverages _native_ `WebSockets`, the browser support for this
module is limited to only those browsers which support native `WebSocket`. That
typically means the last two major versions of a particular browser.

Please visit [caniuse.com](https://caniuse.com/#feat=websockets) for a full
compatibility table.

_Note: We won't be accepting requests for changes to this facet of the module._

## API

### client(compiler, [options])

Returns an `Object` containing:

- `close()` *(Function)* - Closes the WebSocketServer started by the module.
- `wss` *(WebSocketServer)* - A WebSocketServer instance.

#### options

Type: `Object`

##### allEntries

Type: `Boolean`  
Default: `false`

If true and `autoConfigure` is true, will automatically configures each `entry`
key for the webpack compiler. Typically used when working with or manipulating
different chunks in the same compiler configuration.

##### autoConfigure

Type: `Boolean`  
Default: `true`

If true, automatically configures the `entry` for the webpack compiler, and adds
the `HotModuleReplacementPlugin` to the compiler.

##### host

Type: `String|Object`  
Default: `'localhost'`

Sets the host that the `WebSocket` server will listen on. If this doesn't match
the host of the server the module is used with, the module may not function
properly. If the `server` option is defined, and the server has been instructed
to listen, this option is ignored.

If using the module in a specialized environment, you may choose to specify an
`object` to define `client` and `server` host separately. The `object` value
should match `{ client: <String>, server: <String> }`. Be aware that the `client`
host will be used _in the browser_ by `WebSockets`. You should not use this
option in this way unless _you know what you're doing._ Using a mismatched
`client` and `server` host will be **unsupported by the project** as the behavior
in the browser can be unpredictable and is specific to a particular environment.

The value of `host.client` can also be set to a wildcard character for
[Remote Machine Testing](./docs/REMOTE.md).

##### hmr

Type: `Boolean`  
Default: `true`

If true, instructs the client script to attempt Hot Module Replacement patching
of modules.

##### https

Type: `Boolean`  
Default: `false`

If true, instructs the client script to use `wss://` as the `WebSocket` protocol.

When using the `server` option and passing an instance of `https.Server`, this
flag must also be true. Otherwise, the sockets cannot communicate and this
module won't function properly. The module will examine the `server` instance
passed and if `server` _is an instance of `https.Server`, and `https` is not
already set_, will set `https` to `true`.

_Note: When using a self-signed certificate on Firefox, you must add a "Server
Exception" for `localhost:{port}` where `{port}` is either the `port` or the
`port.server` option for secure `WebSocket` to work correctly._

##### logLevel

Type: `String`  
Default: `'info'`

Sets the minimum level of logs that will be displayed in the console. Please see
[webpack-log/#levels][levels] for valid values.

##### logTime

Type: `Boolean`  
Default: `false`

If true, instructs the internal logger to prepend log output with a timestamp.

##### port

Type: `Number|Object`  
Default: `0`

The port the `WebSocket` server should listen on. By default, the socket server
will allocate a port. If a different port is chosen, the consumer of the module
must ensure that the port is free before hand. If the `server` option is defined,
and the server has been instructed to listen, this option is ignored.

If using the module in a specialized environment, you may choose to specify an
`object` to define `client` and `server` port separately. The `object` value
should match `{ client: <Number>, server: <Number> }`. Be aware that the `client`
port will be used _in the browser_ by `WebSockets`. You should not use this
option in this way unless _you know what you're doing._ Using a mismatched
`client` and `server` port will be **unsupported by the project** as the behavior
in the browser can be unpredictable and is specific to a particular environment.

##### reload

Type: `Boolean`  
Default: `true`

If true, instructs the browser to physically refresh the entire page if / when
webpack indicates that a hot patch cannot be applied and a full refresh is needed.

This option also instructs the browser whether or not to refresh the entire page
when `hmr: false` is used.

_Note: If both `hmr` and `reload` are false, and these are permanent settings,
it makes this module fairly useless._

##### server

Type: `Object`  
Default: `null`

If a server instance (eg. Express or Koa) is provided, the `WebSocket` server
will attempt to attach to the server instance instead of using a separate port.

##### stats

Type: `Object`  
Default: `{ context: process.cwd() }`

An object specifying the webpack [stats][stats] configuration. This does not
typically need to be modified.

##### validTargets

Type: `Array[String]`
Default: `['web']`

By default, `webpack-hot-client` is meant to, and expects to function on the
[`'web'` build target](https://webpack.js.org/configuration/target). However,
you can manipulate this by adding targets to this property. eg.

```
  // will be merged with the default 'web' target
  validTargets: ['batmobile']
```

## Communicating with Client WebSockets

Please see the [WebSockets](./docs/WEBSOCKETS.md) documentation.

## Remote Machine Testing

Please see the [Remote Machine Testing](./docs/REMOTE.md) documentation.

## Contributing

We welcome your contributions! Please have a read of
[CONTRIBUTING](./.github/CONTRIBUTING.md) for more information on how to get involved.

## License

#### [MIT](./LICENSE)

[npm]: https://img.shields.io/npm/v/webpack-hot-client.svg
[npm-url]: https://npmjs.com/package/webpack-hot-client

[node]: https://img.shields.io/node/v/webpack-hot-client.svg
[node-url]: https://nodejs.org

[deps]: https://david-dm.org/webpack-contrib/webpack-hot-client.svg
[deps-url]: https://david-dm.org/webpack-contrib/webpack-hot-client

[tests]: 	https://img.shields.io/circleci/project/github/webpack-contrib/webpack-hot-client.svg
[tests-url]: https://circleci.com/gh/webpack-contrib/webpack-hot-client

[cover]: https://codecov.io/gh/webpack-contrib/webpack-hot-client/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/webpack-contrib/webpack-hot-client

[chat]: https://img.shields.io/badge/gitter-webpack%2Fwebpack-brightgreen.svg
[chat-url]: https://gitter.im/webpack/webpack

[size]: https://packagephobia.now.sh/badge?p=webpack-hot-client
[size-url]: https://packagephobia.now.sh/result?p=webpack-hot-client

[dev-middleware]: https://github.com/webpack/webpack-dev-middleware
[dev-server]: https://github.com/webpack/webpack-dev-server
[hmr-docs]: https://webpack.js.org/concepts/hot-module-replacement/
[koa-webpack]: https://github.com/shellscape/koa-webpack
[levels]: https://github.com/webpack-contrib/webpack-log#level
[stats]: https://webpack.js.org/configuration/stats/#stats
