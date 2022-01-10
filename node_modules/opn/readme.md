# open

> Open stuff like URLs, files, executables. Cross-platform.

If need this for Electron, use [`shell.openItem()`](https://electronjs.org/docs/api/shell#shellopenitemfullpath) instead.

Note: The original [`open` package](https://github.com/pwnall/node-open) was recently deprecated in favor of this package, and we got the name, so this package is now named `open` instead of `opn`. If you're upgrading from the original `open` package (`open@0.0.5` or lower), keep in mind that the API is different.

#### Why?

- Actively maintained.
- Supports app arguments.
- Safer as it uses `spawn` instead of `exec`.
- Fixes most of the open original `node-open` issues.
- Includes the latest [`xdg-open` script](http://cgit.freedesktop.org/xdg/xdg-utils/commit/?id=c55122295c2a480fa721a9614f0e2d42b2949c18) for Linux.
- Supports WSL paths to Windows apps under `/mnt/*`.


## Install

```
$ npm install open
```


## Usage

```js
const open = require('open');

// Opens the image in the default image viewer
(async () => {
	await open('unicorn.png', {wait: true});
	console.log('The image viewer app closed');

	// Opens the url in the default browser
	await open('https://sindresorhus.com');

	// Specify the app to open in
	await open('https://sindresorhus.com', {app: 'firefox'});

	// Specify app arguments
	await open('https://sindresorhus.com', {app: ['google chrome', '--incognito']});
})();
```


## API

It uses the command `open` on macOS, `start` on Windows and `xdg-open` on other platforms.

### open(target, [options])

Returns a promise for the [spawned child process](https://nodejs.org/api/child_process.html#child_process_class_childprocess). You would normally not need to use this for anything, but it can be useful if you'd like to attach custom event listeners or perform other operations directly on the spawned process.

#### target

Type: `string`

The thing you want to open. Can be a URL, file, or executable.

Opens in the default app for the file type. For example, URLs opens in your default browser.

#### options

Type: `Object`

##### wait

Type: `boolean`<br>
Default: `false`

Wait for the opened app to exit before fulfilling the promise. If `false` it's fulfilled immediately when opening the app.

Note that it waits for the app to exit, not just for the window to close.

On Windows, you have to explicitly specify an app for it to be able to wait.

##### app

Type: `string | string[]`

Specify the app to open the `target` with, or an array with the app and app arguments.

The app name is platform dependent. Don't hard code it in reusable modules. For example, Chrome is `google chrome` on macOS, `google-chrome` on Linux and `chrome` on Windows.

You may also pass in the app's full path. For example on WSL, this can be `/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe` for the Windows installation of Chrome.


## Related

- [opn-cli](https://github.com/sindresorhus/opn-cli) - CLI for this module
- [open-editor](https://github.com/sindresorhus/open-editor) - Open files in your editor at a specific line and column


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
