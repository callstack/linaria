# Configuration

Linaria can be customized using a JavaScript, JSON or YAML file. This can be in form of:

- `linaria.config.js` JS file exporting the object (recommended).
- `linaria` property in a `package.json` file.
- `.linariarc` file with JSON or YAML syntax.
- `.linariarc.json`, `.linariarc.yaml`, `.linariarc.yml`, or `.linariarc.js` file.

Example `linaria.config.js`:

```js
module.exports = {
  evaluate: true,
  displayName: false,
}
```

## Options

- `evaluate: boolean` (default: `true`):

  Enabling this will evaluate dynamic expressions in the CSS. You need to enable this if you want to use imported variables in the CSS or interpolate other components. Enabling this also ensures that your styled components wrapping other styled components will have the correct specificity and override styles properly.

- `displayName: boolean` (default: `false`):

  Enabling this will add a display name to generated class names, e.g. `.Title_abcdef` instead of `.abcdef'. It is disabled by default to generate smaller CSS files.

- `classNameSlug: string` (default: `default`):

  Using this will provide an interface to customize the output of the CSS class name. Example:

      classNameSlug: '[title]',

  Would generate a class name such as `.header` instead of the default `.header_absdjfsdf` which includes a hash.

  ### Variables

  - `hash`: The hash of the content.
  - `title`: The name of the class.

- `ignore: RegExp` (default: `/node_modules/`):

  If you specify a regex here, files matching the regex won't be processed, i.e. the matching files won't be transformed with Babel during evaluation. If you need to compile certain modules under `/node_modules/`, it's recommended to do it on a module by module basis for faster transforms, e.g. `ignore: /node_modules[\/\\](?!some-module|other-module)/`.

- `babelOptions: Object`

  If you need to specify custom babel configuration, you can pass them here. These babel options will be used by Linaria when parsing and evaluating modules.

## `linaria/babel` preset

The preset pre-processes and evaluates the CSS. The bundler plugins use this preset under the hood. You also might want to use this preset if you import the components outside of the files handled by your bundler, such as on your server or in unit tests.

To use this preset, add `linaria/babel` to your Babel configuration at the end of the presets list:

`.babelrc`:

```diff
{
  "presets": [
    "@babel/preset-env",
    "@babel/preset-react",
+   "linaria/babel"
  ]
}
```

The babel preset can accept the same options supported by the configuration file, however it's recommended to use the configuration file directly.
