# p-series [![Build Status](https://travis-ci.org/sindresorhus/p-series.svg?branch=master)](https://travis-ci.org/sindresorhus/p-series)

> Run promise-returning & async functions in series

If you're doing the same work in each function, use [`p-each-series`](https://github.com/sindresorhus/p-each-series) instead.

See [`p-all`](https://github.com/sindresorhus/p-all) for a concurrent counterpart.


## Install

```
$ npm install p-series
```


## Usage

```js
const pSeries = require('p-series');
const got = require('got');

const tasks = [
	() => got('sindresorhus.com'),
	() => checkSomething(),
	() => doSomethingElse()
];

pSeries(tasks).then(result => {
	console.log(result);
});
```


## API

### pSeries(tasks)

Returns a `Promise` that is fulfilled when all promises returned from calling the functions in `tasks` are fulfilled, or rejects if any of the promises reject. The fulfilled value is an `Array` of the fulfilled values.

#### tasks

Type: `Iterable<Function>`

Functions are expected to return a value. If a Promise is returned, it's awaited before continuing with the next task.


## Related

- [p-all](https://github.com/sindresorhus/p-all) - Run promise-returning & async functions concurrently with optional limited concurrency
- [p-waterfall](https://github.com/sindresorhus/p-waterfall) - Run promise-returning & async functions in series, each passing its result to the next
- [p-each-series](https://github.com/sindresorhus/p-each-series) - Iterate over promises serially
- [More…](https://github.com/sindresorhus/promise-fun)


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
