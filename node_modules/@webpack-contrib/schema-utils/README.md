<div align="center">
  <a href="http://json-schema.org">
    <img width="200"
      src="https://cdn.rawgit.com/webpack-contrib/schema-utils/master/.github/json-schema-logo.svg">
  </a>
  <a href="https://github.com/webpack/webpack">
    <img width="200" src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
</div>

[![npm][npm]][npm-url]
[![node][node]][node-url]
[![deps][deps]][deps-url]
[![tests][tests]][tests-url]
[![chat][chat]][chat-url]

# schema-utils

Webpack Schema Validation Utilities

Validates `options` objects against a [JSON Schema](http://json-schema.org) and
displays the output beautifully.

<img width="645"
  src="https://cdn.rawgit.com/webpack-contrib/schema-utils/master/.github/pretty.png">

## Requirements

This module requires a minimum of Node v6.9.0 and Webpack v4.0.0.

## Getting Started

To begin, you'll need to install `schema-utils`:

```console
$ npm install @webpack-contrib/schema-utils --save-dev
```

## API

When using the API directly, the main entry point  is the `serve` function, which
is the default export of the module.

```js
const validate = require('@webpack-contrib/schema-utils');
const schema = require('path/to/schema.json');
const target = { ... }; // the options object to validate
const name = '...'; // the load or plugin name validate() is being used in

validate({ name, schema, target });
```

### serve(options)

Returns `true` if validation succeeded, `false` validation failed and options
allow the function to return a value. (see options below).

### options

Type: `Object`

Options for initializing and controlling the server provided. The option names
listed below belong to the `options` object.

#### `exit`

Type: `Boolean`
Default: `false`

If `true`, will instruct the validator to end the process with an error code of
`1`.

#### `log`

Type: `Boolean`
Default: `false`

If `true`, will instruct the validator to log the results of the validation (in
the event of a failure) in a
[webpack-style log output](https://github.com/webpack-contrib/webpack-log). This
is typically used with `throw: false`.

<img width="500"
  src="https://cdn.rawgit.com/webpack-contrib/schema-utils/master/.github/output-log-true.png">

#### `name`

Type: `String`
Default: `undefined`
_**Required**_

A `String` specifying the name of the loader or plugin utilizing the validator.

#### `schema`

Type: `String|Object`
Default: `undefined`
_**Required**_

A `String` specifying the filesystem path to the schema used for validation.
Alternatively, you may specify an `object` containing the JSON-parsed schema.

#### `target`

Type: `Object`
Default: `undefined`
_**Required**_

An `Object` containing the options to validate against the specified schema.

#### `throw`

Type: `Boolean`
Default: `true`

By default the validator will throw an error and display validation results upon
failure. If this option is set to `false`, the validator will not throw an error.
This is typically used in situations where a return value of `false` for
`validate()` is sufficient, a stack trace is uneeded, or when
[webpack-style log output](https://github.com/webpack-contrib/webpack-log) is
preferred.

<img width="645"
  src="https://cdn.rawgit.com/webpack-contrib/schema-utils/master/.github/output-throws-true.png">


## Examples

Below is a basic example of how this validator might be used:

```json
# schema.json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "test": {
      "anyOf": [
        { "type": "array" },
        { "type": "string" },
        { "instanceof": "RegExp" }
      ]
    },
    "transform": {
      "instanceof": "Function"
    },
    "sourceMap": {
      "type": "boolean"
    }
  },
  "additionalProperties": false
}
```

### Use in a Loader

```js
const { getOptions } = require('loader-utils');
const validate = require('@webpack-contrib/schema-utils');

import schema from 'path/to/schema.json'

function loader (src, map) {
  const options = getOptions(this) || {};

  validate({ name: 'Loader Name', schema, target: options });

  // Code...
}
```

### Use in a Plugin

```js
const validate = require('@webpack-contrib/schema-utils');
const schema = require('path/to/schema.json');

class Plugin {
  constructor (options) {
    validate({ name: 'Plugin Name', schema, target: options });

    this.options = options;
  }

  apply (compiler) {
    // Code...
  }
}
```

## License

#### [MIT](./LICENSE)

[npm]: https://img.shields.io/npm/v/schema-utils.svg
[npm-url]: https://npmjs.com/package/schema-utils

[node]: https://img.shields.io/node/v/schema-utils.svg
[node-url]: https://nodejs.org

[deps]: https://david-dm.org/webpack-contrib/schema-utils.svg
[deps-url]: https://david-dm.org/webpack-contrib/schema-utils

[tests]: 	https://img.shields.io/circleci/project/github/webpack-contrib/schema-utils.svg
[tests-url]: https://circleci.com/gh/webpack-contrib/schema-utils

[cover]: https://codecov.io/gh/webpack-contrib/schema-utils/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/webpack-contrib/schema-utils

[chat]: https://img.shields.io/badge/gitter-webpack%2Fwebpack-brightgreen.svg
[chat-url]: https://gitter.im/webpack/webpack