# Koa Compress

[![Node.js CI](https://github.com/koajs/compress/workflows/Node.js%20CI/badge.svg?branch=master)](https://github.com/koajs/compress/actions?query=workflow%3A%22Node.js+CI%22+branch%3Amaster)
[![codecov](https://codecov.io/gh/koajs/compress/branch/master/graph/badge.svg)](https://codecov.io/gh/koajs/compress)

Compress middleware for Koa

## Example

```js
var compress = require('koa-compress')
var Koa = require('koa')

var app = new Koa()
app.use(compress({
  filter: function (content_type) {
  	return /text/i.test(content_type)
  },
  threshold: 2048,
  flush: require('zlib').Z_SYNC_FLUSH
}))
```

## Options

The options are passed to `zlib`: http://nodejs.org/api/zlib.html#zlib_options

### filter

An optional function that checks the response content type to decide whether to compress.
By default, it uses [compressible](https://github.com/jshttp/compressible).

### threshold

Minimum response size in bytes to compress.
Default `1024` bytes or `1kb`.

## Manually turning compression on and off

You can always enable compression by setting `ctx.compress = true`.
You can always disable compression by setting `ctx.compress = false`.
This bypasses the filter check.

```js
app.use((ctx, next) => {
  ctx.compress = true
  ctx.body = fs.createReadStream(file)
})
```
