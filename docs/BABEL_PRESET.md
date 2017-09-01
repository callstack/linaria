# `linaria/babel` preset

In order to have styles in `css` tagged template literals evaluated and extracted you need to add the `linaria/babel` preset to your Babel configuration.

`.babelrc`:

```diff
{
  "presets": [
    "es2015",
    "react",
+   "linaria/babel"
  ]
}
```

Now, linaria will evaluate the `css` tags and extract styles to a CSS file for each JS file with the same name and inject `require` call with a path to the extracted CSS file.

For example, CSS file for `App.js` will be named `App.css` and will be written in the same directory as `App.js`.

You can configure the preset by passing and object with options:

```json
{
  "presets": [
    ["linaria/babel", { "filename": "[name]-chunk.css" }]
  ]
}
```

## Options

* `single: boolean` (default: `false`) - Defines whether to extract all styles into single file (if `true`), or into multiple ones for each JS file. If it's set to `false`, require calls for the CSS files will be injected into the JavaScript code, which then can be handled by a bundler like Webpack. Use it, in conjunction with `filename` option to specify filename for extracted styles.
* `filename: string` (default: `'[name].css'`) - Template for a name of file with extracted styles. You can use `[name]` token to inject source JS file's name. You can use any extension you want.
* `outDir: string` (default: N/A) - Path to directory where the CSS files should be saved. It can be absolute or relative to current working directory. If not specified, it will be calculated dynamically from directory name of each JS file.
* `cache: boolean` (default: `true`) - Defines whether to disable the cache. By default it is enabled - if the styles between extractions are the same, the files won't be overwritten again.
* `extract: boolean` (default: `true`) - Defines whether to disable the extraction of styles to CSS files. If set to `false` it will evaluate `css` tags and create a class names for each one, but the CSS files won't be created. Useful in SSR, if you don't want to create CSS files, but you want to have class names.

## Testing components

When testing a component you should disable the extraction, otherwise your test runner will create CSS files.
To do that,  you need to set `extract` to `false` in Babel configuration for `test` environment:

```json
{
  "presets": [
    "linaria/babel"
  ],
  "env": {
    "test": {
      "presets": [
        ["linaria/babel", { "extract": false }]
      ]
    }
  }
}
```

Remember to set `process.env.BABEL_ENV` or `process.env.NODE_ENV` to `test`. If you are using [jest](https://facebook.github.io/jest/), it will be set automatically, otherwise run test with `NODE_ENV=test` prefix - `NODE_ENV=test npm run test`.

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
