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

# cli-utils

A suite of utilities for webpack projects which expose a CLI. The aim of this
module is to provide a uniform experience for displaying CLI help (`--help`),
parsing options for CLI flags, flag recommendations - or "did you mean", and
validation of flags.

## Requirements

This module requires a minimum of Node v6.9.0 and Webpack v4.0.0.

## Getting Started

To begin, you'll need to install `cli-utils`:

```console
$ npm install @webpack-contrib/cli-utils --save
```

## Flags Schema

The exported functions of this module assume that flags are stored in a JSON
schema compatible with [`meow`](https://github.com/sindresorhus/meow). The
schema should follow the format of:

```js
{
  key: { object description }
}
```

Where `key` represents a flag, including any hyphens, but excluding the leading
hyphen(s). And `object description` matches the following format:

```js
{
  "alias": <String>,
  "deprecated": <Boolean>,
  "desc": <String>,
  "type": <Array|String> of [array, boolean, object, string]
}
```

For which all keys are optional, but a `desc` should be provided at a minimum.

The `alias` property contains a flag which can be used as an alias to the parent
key/flag.  
The `deprecated` property indicates that a flag has been deprecated and requires
special notation.  
The `desc` property should contain a reasonable description of the flag. This
can include newline characters which will be considered when rendering help.  
The `type` property specifies the type of value that the flag should contain.
If this property is omitted, any type is considered valid. If more than one type
is possible, specify an array of the valid types. eg. `["boolean", "string"]`.

## API

This module exports three functions: `getHelp`, `getOpts`, and `validate`.

### `getHelp(flags)`

Returns: `String`  
Parameters:

#### `flags`

Type: `Object`  
_Required_

An object containing a valid flag schema.

### `getOpts(flags)`

Returns: `Object`
Parameters:

#### `flags`

Type: `Object`  
_Required_

An object containing a valid flag schema.

### `validate(options)`

Returns: `Boolean`
Parameters:

#### `options`

Type: `Object { argv, flags, prefix, throw }`  
_Required_

An object containing properties used to validate a set of flags against a
flag schema.

#### `options.argv`

Type: `Object`  
_Required_

An object containing the parsed result from either
[`minimist`](https://github.com/substack/minimist) or
[`yargs-parser`](https://github.com/yargs/yargs-parser).

#### `options.flags`

Type: `Object`  
_Required_

An object containing a valid flag schema.

#### `options.prefix`

Type: `String`  
Default: `'webpack'`

A `String` specifying a prefix identifier for the consuming module, used when
reporting errors.

#### `options.throw`

Type: `Boolean`  
Default: `true`

A `Boolean` specifying whether or not to throw an error when a validation
error is encountered. If `false`, will simply log the error and return `false`.

## Contributing

Please take a moment to read our contributing guidelines if you haven't yet done so.

#### [CONTRIBUTING](./.github/CONTRIBUTING.md)

## License

#### [MIT](./LICENSE)

[npm]: https://img.shields.io/npm/v/cli-utils.svg
[npm-url]: https://npmjs.com/package/cli-utils

[node]: https://img.shields.io/node/v/cli-utils.svg
[node-url]: https://nodejs.org

[deps]: https://david-dm.org/webpack-contrib/cli-utils.svg
[deps-url]: https://david-dm.org/webpack-contrib/cli-utils

[tests]: 	https://img.shields.io/circleci/project/github/webpack-contrib/cli-utils.svg
[tests-url]: https://circleci.com/gh/webpack-contrib/cli-utils

[cover]: https://codecov.io/gh/webpack-contrib/cli-utils/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/webpack-contrib/cli-utils

[chat]: https://img.shields.io/badge/gitter-webpack%2Fwebpack-brightgreen.svg
[chat-url]: https://gitter.im/webpack/webpack

[size]: https://packagephobia.now.sh/badge?p=cli-utils
[size-url]: https://packagephobia.now.sh/result?p=cli-utils