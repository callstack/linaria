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

# config-loader

A webpack configuration loader.

This module utilizes [`cosmiconfig`](https://github.com/davidtheclark/cosmiconfig)
which supports declaring a webpack configuration in a number of different file
formats including; `.webpackrc`, `webpack.config.js`, and a `webpack` property
in a `package.json`.

`config-loader` supports configuration modules which export an `Object`, `Array`,
`Function`, `Promise`, and `Function` which returns a `Promise`.

The module also validates found configurations against webpack's options schema
to ensure that the configuration is correct before webpack attempts to use it.

## Requirements

This module requires a minimum of Node v6.9.0 and Webpack v4.0.0.

## Getting Started

To begin, you'll need to install `config-loader`:

```console
$ npm install @webpack-contrib/config-loader --save-dev
```

And get straight to loading a config:

```js
const loader = require('@webpack-contrib/config-loader');
const options = { ... };

loader(options).then((result) => {
  // ...
  // result = { config: Object, configPath: String }
});

```

## Extending Configuration Files

This module supports extending webpack configuration files with
[ESLint-style](https://eslint.org/docs/user-guide/configuring#extending-configuration-files)
`extends` functionality. This feature allows users to create a "base" config and
in essence, "inherit" from that base config in a separate config. A bare-bones
example:

```js
// base.config.js
module.exports = {
  name: 'base',
  mode: 'development',
  plugins: [...]
}
```

```js
// webpack.config.js
module.exports = {
  extends: path.join(..., 'base-config.js'),
  name: 'dev'
```

The resulting configuration object would resemble:

```js
// result
{
  name: 'dev',
  mode: 'development',
  plugins: [...]
}
```

The `webpack.config.js` file will be intelligently extended with properties
from `base.config.js`.

The `extends` property also supports naming installed NPM modules which export
webpack configurations. Various configuration properties can also be filtered in
different ways based on need.

[Read More about Extending Configuration Files](./docs/EXTENDS.md)

## Gotchas

When using a configuration file that exports a `Function`, users of `webpack-cli`
have become accustom to the function signature:

```
function config (env, argv)
```

`webpack-cli` provides any CLI flags prefixed with `--env` as a single object in
the `env` parameter, which is an unnecessary feature.
[Environment Variables](https://en.wikipedia.org/wiki/Environment_variable#Syntax)
have long served the same purpose, and are easily accessible within a
[Node environment](https://nodejs.org/api/process.html#process_process_env).

As such, `config-loader` does not call `Function` configs with the `env`
parameter. Rather, it makes calls with only the `argv` parameter.

## Supported Compilers

This module can support non-standard JavaScript file formats when a compatible
compiler is registered via the `require` option. If the option is defined,
`config-loader` will attempt to require the specified module(s) before the
target config is found and loaded.

As such, `config-loader` will also search for the following file extensions;
`.js`, `.es6`, `.flow`, `.mjs`, and `.ts`.

The module is also tested with the following compilers:

- [`babel-register`](https://github.com/babel/babel/tree/6.x/packages/babel-register)
- [`flow-remove-types/register`](https://github.com/flowtype/flow-remove-types)
- [`ts-node/register`](https://www.npmjs.com/package/ts-node)

_Note: Compilers are not part of or built-into this module. To use a specific compiler, you
must install it and specify its use by using the `--require` CLI flag._

## API

### loader([options])

Returns a `Promise`, which resolves with an `Object` containing:

#### `config`

Type: `Object`

Contains the actual configuration object.

#### `configPath`

Type: `String`

Contains the full, absolute filesystem path to the configuration file.

## Options

#### `allowMissing`

Type: `Boolean`  
Default: `false`

Instructs the module to allow a missing config file, and returns an `Object`
with empty `config` and `configPath` properties in the event a config file was
not found.

### `configPath`

Type: `String`
Default: `undefined`

Specifies an absolute path to a valid configuration file on the filesystem.

### `cwd`

Type: `String`
Default: `process.cwd()`

Specifies an filesystem path from which point `config-loader` will begin looking
for a configuration file.

### `require`

Type: `String | Array[String]`
Default: `undefined`

Specifies compiler(s) to use when loading modules from files containing the
configuration. For example:

```js
const loader = require('@webpack-contrib/config-loader');
const options = { require: 'ts-node/register' };

loader(options).then((result) => { ... });

```

See
[Supported Compilers](https://github.com/webpack-contrib/config-loader#supported-compilers)
for more information.

### `schema`

Type: `Object`
Default: `undefined`

An object containing a valid
[JSON Schema Definition](http://json-schema.org/latest/json-schema-validation.html).

By default, `config-loader` validates your webpack config against the
[webpack config schema](https://github.com/webpack/webpack/blob/master/schemas/WebpackOptions.json).
However, it can be useful to append additional schema data to allow configs,
which contain properties not present in the webpack schema, to pass validation.

## Contributing

Please take a moment to read our contributing guidelines if you haven't yet done so.

#### [CONTRIBUTING](./.github/CONTRIBUTING)

## License

#### [MIT](./LICENSE)

[npm]: https://img.shields.io/npm/v/@webpack-contrib/config-loader.svg
[npm-url]: https://npmjs.com/package/@webpack-contrib/config-loader

[node]: https://img.shields.io/node/v/@webpack-contrib/config-loader.svg
[node-url]: https://nodejs.org

[deps]: https://david-dm.org/webpack-contrib/config-loader.svg
[deps-url]: https://david-dm.org/webpack-contrib/config-loader

[tests]: 	https://img.shields.io/circleci/project/github/webpack-contrib/config-loader.svg
[tests-url]: https://circleci.com/gh/webpack-contrib/config-loader

[cover]: https://codecov.io/gh/webpack-contrib/config-loader/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/webpack-contrib/config-loader

[chat]: https://img.shields.io/badge/gitter-webpack%2Fwebpack-brightgreen.svg
[chat-url]: https://gitter.im/webpack/webpack
