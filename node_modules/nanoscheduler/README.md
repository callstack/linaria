# nanoscheduler
[![npm version][2]][3] [![build status][4]][5]
[![downloads][8]][9] [![js-standard-style][10]][11]

Schedule work to be completed when the user agent is idle. Weighs 270 bytes
compressed.

## Usage
```js
var NanoScheduler = require('nanoscheduler')

var scheduler = NanoScheduler()
var i = 10000
while (i--) scheduler.push(() => console.log(`idle time! ${Date.now()}`))
```

## Why?
Just like with `window.requestAnimationFrame`, it's much more efficient to
share a single instance than to call it for each piece of work. There's a
significant overhead when scheduling small amounts of work. This package allows
sharing a scheduler as a singleton, which makes it particularly useful to be
shared between multiple applications.

## API
### `scheduler = NanoScheduler()`
Create a new scheduler instance. The instance is shared as a singleton on
`window` (if available).

### `scheduler.push(cb)`
Push a callback into the scheduler, to be executed when the user agent is idle.

## Installation
```sh
$ npm install nanoscheduler
```

## License
[Apache-2.0](./LICENSE)

[0]: https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square
[1]: https://nodejs.org/api/documentation.html#documentation_stability_index
[2]: https://img.shields.io/npm/v/nanoscheduler.svg?style=flat-square
[3]: https://npmjs.org/package/nanoscheduler
[4]: https://img.shields.io/travis/choojs/nanoscheduler/master.svg?style=flat-square
[5]: https://travis-ci.org/choojs/nanoscheduler
[6]: https://img.shields.io/codecov/c/github/choojs/nanoscheduler/master.svg?style=flat-square
[7]: https://codecov.io/github/choojs/nanoscheduler
[8]: http://img.shields.io/npm/dm/nanoscheduler.svg?style=flat-square
[9]: https://npmjs.org/package/nanoscheduler
[10]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[11]: https://github.com/feross/standard
