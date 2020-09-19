
# time-fix-plugin

[![NPM version](https://img.shields.io/npm/v/time-fix-plugin.svg?style=flat)](https://npmjs.com/package/time-fix-plugin) [![NPM downloads](https://img.shields.io/npm/dm/time-fix-plugin.svg?style=flat)](https://npmjs.com/package/time-fix-plugin) [![CircleCI](https://circleci.com/gh/egoist/time-fix-plugin/tree/master.svg?style=shield)](https://circleci.com/gh/egoist/time-fix-plugin/tree/master)  [![donate](https://img.shields.io/badge/$-donate-ff69b4.svg?maxAge=2592000&style=flat)](https://github.com/egoist/donate) [![chat](https://img.shields.io/badge/chat-on%20discord-7289DA.svg?style=flat)](https://chat.egoist.moe)

Why? https://github.com/webpack/watchpack/issues/25

## Install


```bash
npm i time-fix-plugin
```

This is for webpack v4 and above, for lower version please use `time-fix-plugin@1`.

## Usage

```js
// webpack.config.js
const TimeFixPlugin = require('time-fix-plugin')

module.exports = {
  plugins: [
    new TimeFixPlugin(),
    // ...other plugins
  ]
}
```

## Development

```bash
# without timefix
node example/run

# with timefix
node example/run --timefix
```

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D


## Author

**time-fix-plugin** © [EGOIST](https://github.com/egoist), Released under the [MIT](./LICENSE) License.<br>
Authored and maintained by EGOIST with help from contributors ([list](https://github.com/egoist/time-fix-plugin/contributors)).

> [github.com/egoist](https://github.com/egoist) · GitHub [@EGOIST](https://github.com/egoist) · Twitter [@_egoistlily](https://twitter.com/_egoistlily)
