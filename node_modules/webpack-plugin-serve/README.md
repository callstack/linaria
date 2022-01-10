[tests]: 	https://img.shields.io/circleci/project/github/shellscape/webpack-plugin-serve.svg
[tests-url]: https://circleci.com/gh/shellscape/webpack-plugin-serve

[cover]: https://codecov.io/gh/shellscape/webpack-plugin-serve/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/shellscape/webpack-plugin-serve

[size]: https://packagephobia.now.sh/badge?p=webpack-plugin-serve
[size-url]: https://packagephobia.now.sh/result?p=webpack-plugin-serve

[https]: https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener
[http2]: https://nodejs.org/api/http2.html#http2_http2_createserver_options_onrequesthandler
[http2tls]: https://nodejs.org/api/http2.html#http2_http2_createsecureserver_options_onrequesthandler

<div align="center">
	<img width="256" src="https://raw.githubusercontent.com/shellscape/webpack-plugin-serve/master/assets/serve.svg?sanitize=true" alt="webpack-plugin-serve"><br/><br/>
</div>

[![tests][tests]][tests-url]
[![cover][cover]][cover-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# webpack-plugin-serve

A Webpack development server in a plugin.

Be sure to [browse our recipes](./recipes/README.md) and peruse the [FAQ](./.github/FAQ.md) after reading the documentation below.

<a href="https://www.patreon.com/shellscape">
  <img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>

_Please consider donating if you find this project useful._

## Requirements

`webpack-plugin-serve` is an [evergreen 🌲](./.github/FAQ.md#what-does-evergreen-mean) module.

This module requires an [Active LTS](https://github.com/nodejs/Release) Node version (v10.0.0+). The client scripts in this module require [browsers which support `async/await`](https://caniuse.com/#feat=async-functions). Users may also choose to compile the client script via an appropriately configured [Babel](https://babeljs.io/) webpack loader for use in older browsers.

## Feature Parity

In many ways, `webpack-plugin-serve` stands out from the alternatives. Feature parity with existing solutions is a high priority. If a feature you've come to expect in an alternative isn't directly available, it's likely easy to implement via middleware. Feel free to open an issue for direction.

For those interested in direct comparisons, please see the [Feature Grid](./.github/FEATURES.md) for a breakdown of feature comparisons between `webpack-plugin-serve` and the alternatives.

## Install

Using npm:

```console
npm install webpack-nano webpack-plugin-serve --save-dev
```

_Note: We recommend using [webpack-nano](https://github.com/shellscape/webpack-nano), a very tiny, very clean webpack CLI._

## Usage

Create a `webpack.config.js` file:

```js
const { WebpackPluginServe: Serve } = require('webpack-plugin-serve');
const options = { ... };

module.exports = {
	// an example entry definition
	entry: [
		'app.js',
		'webpack-plugin-serve/client' // ← important: this is required, where the magic happens in the browser
	]
  ...
  plugins: [
    new Serve(options)
  ],
  watch: true  // ← important: webpack and the server will continue to run in watch mode
};

```

_Note: For more information and examples on configuring the `entry` property, please see the [Configuring Entry Points](./entry-points.md) recipe._

And run `webpack`:

```console
$ npx wp
```

## Options

### `client`
Type: `Object`<br>
Default: `null`

Sets options specifically for the client script. In most situations this option doesn't need to be modified.

#### Properties

#### `client.address`
Type: `String`

If set, allows for overriding the `WebSocket` address, which corresponds to the server address by default. Values for this option should be in a valid `{host}:{port}` format. e.g. `localhost:433`.

#### `client.retry`
Type: `Boolean`

If `true`, instructs the client to attempt to reconnect all `WebSockets` when their connects are interrupted, usually as a result of the server being stopped and/or restarted. _Note: This can be very spammy in the browser console, as there is no way to suppress error messages from the browser when a `WebSocket` fails to connect._

#### `client.silent`
Type: `Boolean`

If `true`, instructs the client not to log anything to the console.


### `compress`
Type: `Boolean`<br>
Default: `false`

If `true`, enables compression middleware which serves files with GZip compression.

### `historyFallback`
Type: `Boolean | Object`<br>
Default: `false`

If `true`, enables History API Fallback via [`connect-history-api-fallback`](https://github.com/bripkens/connect-history-api-fallback). Users may also pass an `options` Object to this property. Please see `connect-history-api-fallback` for details.

This setting can be handy when using the HTML5 History API; `index.html` page will likely have to be served in place of any 404 responses from the server, specially when developing Single Page Applications.

_Note: The `Accept` header is explicitly stripped from the `/wps` WebSocket path when using `historyFallback`, due to [an issue](https://github.com/shellscape/webpack-plugin-serve/issues/94) with how Firefox and the middleware interact._

### `hmr`
Type: `boolean`<br>
Default: `true`

If `true`, will enable [`Hot Module Replacement`](https://webpack.js.org/concepts/hot-module-replacement/) which exchanges, adds, or removes modules from a bundle dynamically while the application still running, without the need of a full page reload.

_Note: If the build process generates errors, the client (browser) will not be notified of new changes and no HMR will be performed. Errors must be resolved before HMR can proceed._

### `host`
Type: `String | Promise`<br>
Default: `::` for IPv6, `127.0.0.1` for IPv4

Sets the host the server should listen from. Users may choose to set this to a `Promise`, or a `Function` which returns a `Promise` for situations in which the server needs to wait for a host to resolve.

_Note: The default URI is `http://[::]:{port}`. For more info, please read [the FAQ](.github/FAQ.md)._

### `http2`
Type: `boolean` | [`http2` options](https://nodejs.org/api/http2.html#http2_http2_createserver_options_onrequesthandler) | [secure `http2` options](https://nodejs.org/api/http2.html#http2_http2_createsecureserver_options_onrequesthandler)

If set, this option will instruct the server to enable HTTP2. Properties for this option should correspond to [HTTP2 options][http2] or [HTTP2 SSL options][http2tls].

### `https`
Type: `Object`<br>
Default: `null`

If set, this option will instruct the server to enable SSL via HTTPS. Properties for this option should correspond to [HTTPS options][https].

### `liveReload`
Type: `boolean`<br>
Default: `false`

If `true`, will instruct the client to perform a full page reload after each build.

_Note: This option overrides any value set for the `hmr` option property._

### `log`
Type: `String`<br>
Default: `{ level: 'info' }`<br>
Valid `level` Values: `'trace' | 'debug' | 'info' | 'warn' | 'error'`

Sets a level for which messages should appear in the console. For example: if `warn` is set, every message at the `warn` and `error` levels will be visible. This module doesn't produce much log output, so you probably won't have to fiddle with this.

A `timestamp: true` property/value may also be used to preface each log line with an `HH:mm:ss` format timestamp.

### `middleware`
Type: `Function`<br>
Default: `(app, builtins) => {}`

Allows users to implement custom middleware, and manipulate the order in which built-in middleware is executed. This method may also return a `Promise` to pause further middleware evaluation until the `Promise` resolves. This property should only be set by users with solid knowledge of Express/Koa style middleware and those which understand the consequences of manipulating the order of built-in middleware.

#### Example

```js
// webpack.config.js
module.exports = {
  plugins: [
    new WebpackPluginServe({
      middleware: (app, builtins) =>
        app.use(async (ctx, next) => {
          ctx.body = 'Hello world';
          await next();
        })
    })
  ]
};
```

Currently supported built-in middleware that are available on the `builtins` parameter:

`compress` → forwards to [koa-compress](https://github.com/koajs/compress)<br>
`four0four` → handles requests that result in a 404 status<br>
`headers` → applies specified custom headers to each request<br>
`historyFallback` → forwards to [connect-history-api-fallback](https://github.com/bripkens/connect-history-api-fallback/)<br>
`proxy` → forwards to [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware)<br/>
`static` → forwards to [koa-static](https://github.com/koajs/static)<br>
`websocket` → Custom middleware that provides `WebSocket` support

### `open`
Type: `boolean | Object`<br>
Default: `false`

If `true`, opens the default browser to the set `host` and `port`. Users may also choose to pass an `Object` containing options for the [`opn`](https://github.com/sindresorhus/opn) module, which is used for this feature.

### `port`
Type: `Number | Promise`<br>
Default: `55555`

Sets the port on which the server should listen. Users may choose to set this to a `Promise`, or a `Function` which returns a `Promise` for situations in which the server needs to wait for a port to resolve.

### `progress`
Type: `boolean | String`<br>
Default: `true`

If [truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy), the module will add a `ProgressPlugin` instance to the `webpack` compiler, and display a progress indicator on the page within the browser.

If a value of `'minimal'` is set, the progress indicator will render as a small, colored bar at the top of the window. This can be useful when the default fancy progress indicator interferes with elements in the page.

### `ramdisk`
Type: `boolean`<br>
Default: `false`<br>
Support: MacOS and Linux, Windows with WSL 2.0.

If `true`, will apply [`webpack-plugin-ramdisk`](https://www.npmjs.com/package/webpack-plugin-ramdisk) to the build. `output` configuration does not have to be modified, a symlink will be created from the original output path to the output path on the ramdisk. _**Note:** This will remove an existing directory at the defined output path._

Leveraging this option can result in significant reduction of build time, which is especially useful when using `hmr: true` or `liveReload: true`. Typical build times can be cut by 25-32% or more depending on hardware and webpack configuration. This is also recommended for users with SSD, as it reduces hard disk thrashing.

Windows users without WSL 2.0 are encouraged to install it to make use of this feature, or create a ramdisk manually using a tool like [ImDisk](https://sourceforge.net/projects/imdisk-toolkit/).

### `static`
Type: `String | Array(String) | Object`<br>
Default: `compiler.context`

Sets the directory(s) from which static files will be served from the root of the application. Bundles will be served from the `output` config setting. For specifying options for static file directories, please see [`middleware > static`](#middleware). For a in-depth example, check out the [Static HTML File](./recipes/static-html-files.md) recipe.

The `static` option supports [glob patterns](https://github.com/sindresorhus/globby#globbypatterns-options) when an `Object` is passed with a `glob` property. This is useful for targeting only specific directories in a complex tree. Users may also provide an `options` property which supports [globby options](https://github.com/sindresorhus/globby#options). For example:

```js
static: {
  glob: [path.join(__dirname, 'dist/**/public')],
  options: { onlyDirectories: true }
}
```

### `status`
Type: `boolean`<br>
Default: `true`

By default, `webpack-plugin-serve` will display a status overlay when a build results in errors and/or warnings. To disable this feature, set `status: false` in the options.

<div align="center">
	<img height="244" src="assets/status-overlay.png" alt="status overlay"><br/><br/>
</div>

When the minimize button (yellow dot) is clicked, the overlay will shrink to a single small box in the lower right corner of the page and display a status beacon using the same green, red, and yellow colors for build success, errors, and warnings, respectively.

<div align="center">
	<img src="assets/status-beacons.gif" alt="status beacons"><br/><br/>
</div>

### `waitForBuild`
Type: `boolean`<br>
Default: `false`

If `true`, instructs the server to halt middleware processing until the current build is done.

## Proxying

Proxying with `webpack-plugin-serve` is supported via the [`middleware`](#middleware) option. But while this plugin module doesn't contain any fancy options processing for proxying, it does include access to the [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware) module by default, and the rest should look familiar to users of `http-proxy-middleware`.

```js
// webpack.config.js
module.exports = {
  ...,
  plugins: [
    new WebpackPluginServe({
      middleware: (app, builtins) => {
        app.use(builtins.proxy('/api', { target: 'http://10.10.10.1:1337' }));
      }
    })
  ]
};
```

_Note: The `app.use(...)` call here is slightly different than what Express users are used to seeing with `http-proxy-middleware`. This is due to subtle differences in how the module interacts with `Koa`, which is used under the hood in this plugin._

## TypeScript Types

To get type definitions for this project:

```console
npm install -D @types/webpack-plugin-serve
```

## Meta

[CONTRIBUTING](./.github/CONTRIBUTING.md)

[LICENSE (Mozilla Public License)](./LICENSE)
