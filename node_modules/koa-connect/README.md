# koa-connect [![npm package badge][npm badge]][npm]

[npm badge]: https://badge.fury.io/js/koa-connect.svg
[npm]: https://www.npmjs.com/package/koa-connect

Use [Express](https://github.com/strongloop/express)/[Connect](https://github.com/senchalabs/connect) middleware with [Koa](https://github.com/koajs/koa).

## Warning

It is **highly** recommended to use a Koa-specific middleware instead of trying to convert an Express version when they're available. There is a non-trivial difference in the Koa and Express designs and you will inevitably run into some issues. This module is a workaround for the specific cases where the differences can be ignored. Additionally, it also enables library authors to write 1 version of their HTTP middleware.

### Always use `next` middleware parameter

Express middlewares need to declare and invoke the `next` callback appropriately for the koa-connect integration to work correctly.

### For library authors

If you're attempting to write a framework-agnostic middleware library, be sure to use only core HTTP methods and not any Express-dependent APIs like `res.send`.

## Installation

```sh
npm install koa-connect
```

## Usage

See [`examples/`](./examples) for more practical usage.

```javascript
const Koa = require('koa');
const c2k = require('koa-connect');

// A generic Express-style middleware function
function connectMiddlware(req, res, next) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('From the Connect middleware');
  next();
}

// A generic Koa middlware, without async/await
function koaMiddlware(ctx, next) {
  next()
    .then(() => {
      // The control flow will bubble back to here, like usual
    })
    .catch((err) => {
      // Error handling from downstream middleware, like usual
    });
}

// A generic Koa middlware with async/await
async function koaMiddleware(ctx, next) {
  try {
    await next();
  } catch (e) {
    // Normal error handling
  }
  // Normal control flow
}

const app = new Koa();
app.use(koaMiddlware);
app.use(c2k(connectMiddlware));
app.use((ctx, next) => {
  console.log('It will continue on to here');
});

app.listen(3000);
```

## Contributing

### Developing

`npm start` starts the TypeScript compiler in watch mode. Code will be auto-formatted upon commit as part of the Prettier + lint-staged + Husky setup.

### Building

`npm run build` produces the types declaration file and JavaScript file for publishing.

### Testing

`npm test` runs the tests. Tests are in `tests.js` and are made with the [Mocha](https://mochajs.org) framework.

Use `npm run test:watch` in conjunction with `npm start` to automatically re-run the tests when the source changes.

## License

MIT
