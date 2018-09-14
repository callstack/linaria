# `linaria/babel` preset

__If you use Webpack__, we highly recommend to use `linaria/loader`. It supports the same options as the preset. [See here](./BUNDLERS_INTEGRATION.md#loader) for instructions on configuring the loader.

---

In order to have styles in `css` tagged template literals evaluated and extracted you need to add the `linaria/babel` preset to your Babel configuration.

`.babelrc`:

```diff
{
  "presets": [
    "env",
    "react",
+   "linaria/babel"
  ]
}
```

Now, linaria will evaluate the `css` tags and extract styles to a CSS file for each JS file with the same name and inject `require` call with a path to the extracted CSS file.

For example, CSS file for `src/components/App.js` will be named `src/components/App.css` and will be written inside `.linaria-cache` with directory - `.linaria-cache/src/components/App.css`.

You can configure the preset by passing and object with options:

```json
{
  "presets": [
    ["linaria/babel", { "outDir": "css-output" }]
  ]
}
```

## Options

* `single: boolean` (default: `false`) - Defines whether to extract all styles into single file (if `true`), or into multiple ones for each JS file. If it's set to `false`, require calls for the CSS files will be injected into the JavaScript code, which then can be handled by a bundler like Webpack. Use it, in conjunction with `filename` option to specify filename for extracted styles.
* `filename: string` (default: `'styles.css'`) - Name of the file with extracted styles. You can use any extension you want. __This option has effect only if `single` is set to `true`.__
* `outDir: string` (default: `'.linaria-cache'`) - Path to directory where the CSS files should be saved. It must be relative to the current working directory. If `single` is set to `false` the __directory structure from the source will be preserved__.
* `cache: boolean` (default: `true`) - Defines whether to disable the cache. By default it is enabled - if the styles between extractions are the same, the files won't be overwritten again.
* `extract: boolean` (default: `true`) - Defines whether to disable the extraction of styles to CSS files. If set to `false` it will evaluate `css` tags and create a class names for each one, but the CSS files won't be created. Useful in SSR, if you don't want to create CSS files, but you want to have class names.
* `minifyClassnames: boolean` (default: `false`) - Define whether to minify class names matching pattern `/ln[a-zA-Z0-9]{6}/`.

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

## Integrating with other tools

Linaria can be used together with many great tools, frameworks and boilerplates, but unfortunately it usually means some configuration changes.

### Create React App (ejected)

```json
{
  "babel": {
    "presets": [
      "react-app",
      "env",
      [
        "linaria/babel",
        {
          "outDir": "./src/.linaria-cache"
        }
      ]
    ]
  }
}
```

This will extract your CSS to `src/.linaria-cache` directory (add it to your `.gitignore`).

### Next.js

```json
{
  "presets": [
    "next/babel",
    "env",
    [
      "linaria/babel",
      {
        "filename": "style.css",
        "outDir": "./static",
        "single": true
      }
    ]
  ]
}
```

Since `next` server renders our app, we need to tweak our configuration. We want to extract styles to a single file, which we can then be declared in e.g. custom `<Head>` component.

```js
import Head from 'next/head';
import {css} from 'linaria';

const header = css`background: yellow;`;

export default () => (
  <div>
    <Head>
      <title>This page has a title 🤔</title>
      <meta charSet="utf-8" />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      <link rel="stylesheet" href="/static/style.css" />
    </Head>

    <div className={header}>Welcome to next.js!</div>
  </div>
);
```
