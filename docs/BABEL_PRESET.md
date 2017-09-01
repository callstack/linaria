# `libaria/babel` preset

In order to have styles in `css` tagged template literals evaluated and extracted you need to add a `linaria/babel` preset to your Babel configuration.

`.babelrc`:

```json
{
  "presets": [
    "libaria/babel"
  ]
}
```

Now, linaria will evaluate the `css` tags and extract styles to a CSS file for each JS file with the same name and inject `require` call with a absolute path to extracted CSS file.

For example, CSS file for `App.js` will be named `App.css` and will be written in the same directory as `App.js`.

You can configure the preset by passing and object with options:

```json
{
  "presets": [
    ["libaria/babel", { "filename": "[name]-chunk.css" }]
  ]
}
```

## Options

* `single: boolean` (default: `false`) - Defines whether to extract all styles into single file (if `true`), or into multiple ones for each JS file. If it's set to `false`, the JS file will have `require` call with absolute path to extracted CSS file injected into. Use it, in conjunction with `filename` option to specify filename for extracted styles.
* `filename: string` (default: `'[name].css'`) - Template for a name of file with extracted styles. You can use `[name]` token to inject source JS file's name. You can use any extension you want.
* `outDir: string` (default: N/A) - Path to directory where the CSS files should be saved. It can be absolute or relative to current working directory. If not specified, it will be calculated dynamically from directory name of each JS file.
* `cache: boolean` (default: `true`) - Defines whether to disable the cache. By default it is enabled - if the styles between extractions are the same, the files won't be overwritten again.
* `extract: boolean` (default: `true`) - Defines whether to disable the extraction of styles to CSS files. If set to `false` it will evaluate `css` tags and create a class names for each one, but the CSS files won't be created. Useful in SSR, if you don't want to create CSS files, but you want to have class names.

## Examples

### Extract to a single file

```json
{
  "presets": [
    ["linaria/babel", {
      "single": true,
      "filename": "styles.css",
      "outDir": "static"
    }]
  ]
}
```

Will extract all styles into `styles.css` file in `static` directory relatively to command working directory.

### Extract into multiple files and store them based on a absolute path

```json
{
  "presets": [
    ["linaria/babel", {
      "outDir": "/path/to/directory"
    }]
  ]
}
```

Will extract styles into multiple files based on JS file name and store in `/path/to/directory`.
For example a full path for CSS from file `MyComponent.js` will be `/path/to/directory/MyComponent.css`.
