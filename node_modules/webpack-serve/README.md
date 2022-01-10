[tests]: 	https://img.shields.io/circleci/project/github/shellscape/webpack-serve.svg
[tests-url]: https://circleci.com/gh/shellscape/webpack-serve

[cover]: https://codecov.io/gh/shellscape/webpack-serve/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/shellscape/webpack-serve

[size]: https://packagephobia.now.sh/badge?p=webpack-serve
[size-url]: https://packagephobia.now.sh/result?p=webpack-serve

[https]: https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener
[http2]: https://nodejs.org/api/http2.html#http2_http2_createserver_options_onrequesthandler
[http2tls]: https://nodejs.org/api/http2.html#http2_http2_createsecureserver_options_onrequesthandler

<div align="center">
	<img width="256" src="https://raw.githubusercontent.com/shellscape/webpack-serve/master/assets/serve.svg?sanitize=true" alt="webpack-serve"><br/><br/>
</div>

[![tests][tests]][tests-url]
[![cover][cover]][cover-url]
[![size][size]][size-url]

# webpack-serve

A CLI for [`webpack-plugin-serve`](https://github.com/shellscape/webpack-plugin-serve) - A Webpack development server in a plugin.

_(While using a CLI such as webpack-serve is convenient, we recommend using [`webpack-plugin-serve`](https://github.com/shellscape/webpack-plugin-serve) directly in your webpack config, with [`webpack-nano`](https://github.com/shellscape/webpack-nano), instead.)_

<a href="https://www.patreon.com/shellscape">
  <img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>

_Please consider donating if you find this project useful._

## Requirements

`webpack-serve` is an [evergreen 🌲](./.github/FAQ.md#what-does-evergreen-mean) module.

This module requires an [Active LTS](https://github.com/nodejs/Release) Node version (v8.0.0+ or v10.0.0+). The client scripts in this module require [browsers which support `async/await`](https://caniuse.com/#feat=async-functions). Users may also choose to compile the client script via an appropriately configured [Babel](https://babeljs.io/) webpack loader for use in older browsers.

## Feature Parity

Since this CLI leverages `webpack-plugin-serve`, the same feature parity information applies. Please see the [`webpack-plugin-serve` Feature Comparison](https://github.com/shellscape/webpack-plugin-serve/blob/HEAD/.github/FEATURES.md) for more information.

## Install

Using npm:

```console
npm install webpack-serve --save-dev
```

## Usage

```console
A CLI for webpack-plugin-serve, providing a premier webpack development server

Usage
  $ webpack-serve [...options]

Options
  --all               Apply webpack-plugin-serve to all compilers in the config
  --client.address    Overrides the WebSocket address in the client
  --client.retry      Instructs the client to attempt to reconnect all WebSockets when interrupted
  --client.silent     Instructs the client not to log anything to the console.
  --compress          Enables compression middleware which serves files with GZip compression.
  --config            A path to a webpack config file
  --config.{name}     A path to a webpack config file, and the config name to run
  --help              Displays this message
  --history-fallback  Enables History API Fallback
  --hmr               Enables Hot Module Replacement. On by default
  --host              Sets the host the server should listen from
  --http2             Instructs the server to enable HTTP2
  --live-reload       Instructs the client to perform a full page reload after each build
  --no-watch          Does not apply \`watch: true\` to the config, allowing for greater customization
  --open              Opens the default browser to the set host and port
  --port              Sets the port on which the server should listen
  --progress          Shows build progress in the client
  --silent            Instruct the CLI to produce no console output
  --static            Sets the directory from which static files will be served
  --status            Shows build status (errors, warnings) in the client
  --version           Displays webpack-nano and webpack versions
  --wait-for-build    Instructs the server to halt middleware processing until the current build is done.

Examples
  $ webpack-serve
  $ webpack-serve --help
  $ webpack-serve --config webpack.config.js
  $ webpack-serve --config.serve webpack.config.js
```

## Flags

Please reference the [`webpack-plugin-serve` Options](https://github.com/shellscape/webpack-plugin-serve#options) for information and use. Most options are analogous to the flags listed above.

#### `--no-watch`

By default, the CLI will apply `watch: true` to the first config in the targeted webpack config file. To customize watching or `watchOptions`, please use this flag and customize the config(s) accordingly.

## package.json Options

For convenience, `webpack-plugin-serve` options can also be defined in a `package.json` file. This CLI will look for a `serve` key in the nearest `package.json` beginning in the directory containing the specified `webpack.config.js`, up to the current working directory. Please reference the [`webpack-plugin-serve` Options](https://github.com/shellscape/webpack-plugin-serve#options) for information and use.

For Example:

```json
{
	"name": "some-package",
	"version": "1.0.0",
	"serve": {
    "host": "10.10.10.1"
  }
}
```

## Advanced Options

For options which require providing functions or complex objects like `Promises` which cannot be represented by JSON, nor on the command line, please use [`webpack-plugin-serve`](https://github.com/shellscape/webpack-plugin-serve) directly in your webpack config, along with [`webpack-nano`](https://github.com/shellscape/webpack-nano).

## Meta

[CONTRIBUTING](./.github/CONTRIBUTING.md)

[LICENSE (Mozilla Public License)](./LICENSE)
