[tests]: 	https://img.shields.io/circleci/project/github/shellscape/webpack-plugin-ramdisk.svg
[tests-url]: https://circleci.com/gh/shellscape/webpack-plugin-ramdisk

[cover]: https://codecov.io/gh/shellscape/webpack-plugin-ramdisk/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/shellscape/webpack-plugin-ramdisk

[size]: https://packagephobia.now.sh/badge?p=webpack-plugin-ramdisk
[size-url]: https://packagephobia.now.sh/result?p=webpack-plugin-ramdisk

[https]: https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener
[http2]: https://nodejs.org/api/http2.html#http2_http2_createserver_options_onrequesthandler
[http2tls]: https://nodejs.org/api/http2.html#http2_http2_createsecureserver_options_onrequesthandler

<div align="center">
	<img width="256" src="https://raw.githubusercontent.com/shellscape/webpack-plugin-ramdisk/master/assets/ramdisk.svg?sanitize=true" alt="webpack-plugin-ramdisk"><br/><br/>
</div>

[![tests][tests]][tests-url]
[![cover][cover]][cover-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# webpack-plugin-ramdisk

🐏 A webpack plugin for blazing fast builds on a RAM disk / drive

<a href="https://www.patreon.com/shellscape">
  <img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>

_Please consider donating if you find this project useful._

### What It Does

This plugin will initialize and mount a [RAM disk / drive](https://en.wikipedia.org/wiki/RAM_drive) to enable faster build emitting times. This has advantages over third-party in-memory filesystems in that it uses Node's `fs` module in conjunction with the local system's native capabilities. It's especially useful for projects which need to perform many successive builds, such as during development with Hot Module Reloading enabled. In an HMR scenario, this will also _prevent excessive writes_ to Solid State Drives, preventing the shortening of the drive's lifespan.

## Requirements

`webpack-plugin-ramdisk` is an [evergreen 🌲](./.github/FAQ.md#what-does-evergreen-mean) module.

This module requires an [Active LTS](https://github.com/nodejs/Release) Node version (v10.0.0+).

## Install

Using npm:

```console
npm install webpack-nano webpack-plugin-ramdisk --save-dev
```

_Note: We recommend using [webpack-nano](https://github.com/shellscape/webpack-nano), a very tiny, very clean webpack CLI._

## Usage

When the plugin is applied during a webpack build, the `output` path specified for a compiler configuration is _appended to the RAMdisk path_. Be sure to choose an appropriate output path!

Create a `webpack.config.js` file:

```js
const { WebpackPluginRamdisk } = require('webpack-plugin-ramdisk');
const options = { ... };

module.exports = {
	// an example entry definition
	output: {
		path: '/myapp/dist'  // ← important: this must be an absolute path!
  }
  ...
  plugins: [
    new WebpackPluginRamdisk(options)
  ]
};

```

And run `webpack`:

```console
$ npx wp
```

You'll then see that build output has been written to the RAMdisk. In our example above on a MacOS computer, the output path would be `/Volumes/wpr/myapp/dist`.

## Options

### `blockSize`
Type: `Number`<br>
Default: `512`

Sets the [block size](https://en.wikipedia.org/wiki/Block_(data_storage)) used when allocating space for the RAMdisk.

### `bytes`
Type: `Number`<br>
Default: `2.56e8`

Sets the physical size of the RAMdisk, in bytes. The default value is 256mb. Most builds won't require nearly that amount, and the value can be lowered. For extremely large builds, this value may be increased as needed.

### `name`
Type: `String`<br>
Default: `wpr`

Sets the name of the disk/drive/mount point for the RAMdisk. e.g. A value of `batman` would result in a disk root of `/Volumes/batman` on MacOS and `/mnt/batman` on Linux variants.

## API

### `WebpackPluginRamdisk.cleanup(diskPath)`
Parameters: `diskPath` ⇒ `String` The mounted path of the RAMdisk to unmount and remove

`Static`. Provides a convenience method to unmount and remove a RAMdisk created with the plugin.

To remove the RAMdisk that the plugin created, first obtain the `diskPath` from the plugin:

```js
const { WebpackPluginRamdisk } = require('webpack-plugin-ramdisk');
const plugin = new WebpackPluginRamdisk(options)
const { diskPath } = plugin;

WebpackPluginRamdisk.cleanup(diskPath);
```

_**Use Caution** as specifying the wrong `diskPath` can have unintended consequences and cause a loss of data. The commands this method utilize can remove other drives as well._

### Linux Users

Automatic creation of a RAMdisk requires administrative permissions. During the build process you'll be prompted by `sudo` to enter your credentials.

### Windows Users

Windows users that have installed [Windows Subsystem for Linux v2](https://devblogs.microsoft.com/commandline/announcing-wsl-2/) can use the module without issue.

However, Windows users without WSL2 are in a pickle. Unfortunately Windows does not ship with any capabilities that allow for creation of RAM disks / drives programmatically, without user interaction. This is an OS limitation and we cannot work around it. However, there is a solution for Windows users - tools like [ImDisk](https://sourceforge.net/projects/imdisk-toolkit/) will allow you to create a RAMdisk and assign it a drive letter, to which one can point a webpack configuration's `output` property.

## Performance

Average savings for a bundle's total build time ranges from 25-32% according to tests we've run on a variety of platforms and bundle sizes. The largest gains were during frequently Hot Module Reloading operations, where one or more files were changed and the bundle(s) were rebuilt during watch mode.

For example, the following stats were generated for a 13mb bundle:

Without `webpack-plugin-ramdisk`:
 - initial build and emit: 19.88s
 - initial file change, save, and rebuild: 0.6s
 - subsequent changes and rebuilds: 1.15s 0.864s 1.68s

Average build and emit time: 1.23s

With `webpack-plugin-ramdisk`:
 - initial build and emit: 16.8s
 - initial file change, save, and rebuild: 0.9s
 - subsequent changes and rebuilds: 1.23s, 0.951s, 0.48s

Average build and emit time: 0.887s

Result = 28% time savings. This may seem inconsequential, but consider the number of times a single developer will save and rebuild for HMR during the course of a workday. When aggregated, that's a considerable savings throughout a session.

## Removing the RAMdisk

_These commands use `wpr` as the RAMdisk name. If the `name` option has been modified, swap `wpr` for the value specified in the options._

On MacOS:

```console
$ umount /Volumes/wpr
$ hdiutil detach /Volumes/wpr
```

On Linux:

```console
$ sudo umount /mnt/wpr
```

## Meta

[CONTRIBUTING](./.github/CONTRIBUTING.md)

[LICENSE (Mozilla Public License)](./LICENSE)
