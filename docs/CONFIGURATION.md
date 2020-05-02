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

- `classNameSlug: string | (hash: string, title: string) => string` (default: `default`):

  Using this will provide an interface to customize the output of the CSS class name. Example:

      classNameSlug: '[title]',

  Would generate a class name such as `.header` instead of the default `.header_absdjfsdf` which includes a hash.

  You may also use a function to define the slug. The function will be evaluated at build time and must return a string:

      classNameSlug: (hash, title) => `${hash}__${7 * 6}__${title}`,

  Would generate the class name `.absdjfsdf__42__header`.

  **note** invalid characters will be replaced with an underscore (`_`).

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

## Preact

If you wish you use Preact, we recommend you to use the `preact-cli` and start from there. The following configuration assumes you are using the default template provided by preact-cli. Start by creating your project using;

```
npx preact-cli create default my-project
```

On top of the default template, you will need to install `@babel/preset-react`. This is because Linaria works with JSX syntax. Otherwise, preact will throw an error saying that `linaria/loader` can't parse JSX. Don't forget to install `linaria`!.

After that, your `package.json` should look like the following:

```diff
"devDependencies": {
+   "@babel/preset-react": "^7.8.3",
    "enzyme": "^3.10.0",
    "enzyme-adapter-preact-pure": "^2.0.0",
    "eslint": "^6.0.1",
    "eslint-config-preact": "^1.1.0",
    "identity-obj-proxy": "^3.0.0",
    "jest": "^24.9.0",
    "jest-preset-preact": "^1.0.0",
    "per-env": "^1.0.2",
    "preact-cli": "^3.0.0-rc.6",
    "preact-render-spy": "^1.2.1",
    "sirv-cli": "^0.4.5"
  },
  "dependencies": {
+   "linaria": "^1.3.3",
    "preact": "^10.3.2",
    "preact-render-to-string": "^5.1.4",
    "preact-router": "^3.2.1"
  },
```

> If you wish to work with TypeScript, you will also need to install `@babel/preset-typescript`

For some reason, Preact does not like when you push presets/plugins using their `preact.config.js` to the babel loader. And for Linaria to work, we need to install `linaria/babel` preset and the `linaria/loader` loader. Therefore, we extract all the plugins from preact's babel configuration (you can do this by console logging `config.module.rules[0]` and looking for the plugins object in your `preact.config.js`). 


```js
const babelLoaderRule = config.module.rules[0];
babelLoaderRule.options.presets.push('@babel/preset-react');
babelLoaderRule.options.presets.push('linaria/loader');
```

Because of that, we need to create a `.babelrc` file with the following:

```
{
  "presets": ["@babel/preset-env", "@babel/preset-react", "linaria/babel"],
  "plugins": [
    "./node_modules/@babel/plugin-syntax-dynamic-import/lib/index.js",
    "./node_modules/@babel/plugin-transform-object-assign/lib/index.js",
    [
      "./node_modules/@babel/plugin-proposal-decorators/lib/index.js",
      {
        "legacy": true
      }
    ],
    [
      "./node_modules/@babel/plugin-proposal-class-properties/lib/index.js",
      {
        "loose": true
      }
    ],
    "./node_modules/@babel/plugin-proposal-object-rest-spread/lib/index.js",
    "./node_modules/babel-plugin-transform-react-remove-prop-types/lib/index.js",
    [
      "./node_modules/@babel/plugin-transform-react-jsx/lib/index.js",
      {
        "pragma": "h",
        "pragmaFrag": "Fragment"
      }
    ],
    [
      "./node_modules/fast-async/plugin.js",
      {
        "spec": true
      }
    ],
    "./node_modules/babel-plugin-macros/dist/index.js"
  ]
}
```

> The plugins listed here are based on preact's default template/cli. If you wish to change your starting template, a similar process could be done. We removed `@babel/preset-typescript`, but if you wish to use TS, add the preset in between `preset-env` and `preset-react`.

Finally, in your `preact.config.js`, we will modify the babel loader to avoid having conflicting plugins and presets. Add the following:

```js
export default config => {
  const newBabelLoader = {
    test: /\.jsx?$/, //If you are using TS, use -> /\.m?[jt]sx?$/
    exclude: /node_modules/,
    enforce: "pre", //Don't delete this
    resolve: { mainFields: ["module", "jsnext:main", "browser", "main"] }, //Don't delete this
    use: [
      {
        loader: "babel-loader",
        options: {
          plugins: [] 
        }
      },
      { loader: "linaria/loader" }
    ]
  };

  config.module.rules[0] = newBabelLoader; //override your babel-loader rule
};
```

After all of that, you should be able to run `npm build`, and it should have no errors. 

To test that everthing is working, go to a file, for example `components/Header/index.js`, and create a class name.

```js
import { h } from "preact";
import { Link } from "preact-router/match";
import style from "./style.css";

import { css } from "linaria";

const className = css`
  color: red;
  font-weight: 800;
`;

const Header = () => (
  <header class={style.header}>
    <h1>Preact App</h1>
    <nav>
      <Link activeClassName={style.active} href="/">
        Home
      </Link>
      <Link activeClassName={style.active} href="/profile">
        Me
      </Link>
      <Link activeClassName={style.active} href="/profile/john">
        John
      </Link>
    </nav>
    <button class={className}>Hello</button> //here I use it
  </header>
);

export default Header;
```

> You can also use the `styled` variant, importing from `linaria/react`.

If you run `npm run dev`, you should be able to see a button next to the nav title, with red bold text.

You can take a look at this example [here](../examples/Preact)
