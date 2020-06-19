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
};
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

- `rules: EvalRule[]`

  The set of rules that defines how the matched files will be transformed during the evaluation.
  `EvalRule` is an object with two fields:

  - `test` is a regular expression or a function `(path: string) => boolean`;
  - `action` is an `Evaluator` function, `"ignore"` or a name of the module that exports `Evaluator` function as a default export.

  If `test` is omitted, the rule is applicable for all the files.

  The last matched rule is used for transformation. If the last matched action for a file is `"ignore"` the file will be evaluated as is, so that file must not contain any js code that cannot be executed in nodejs environment (it's usually true for any lib in `node_modules`).

  If you need to compile certain modules under `/node_modules/` (which can be the case in monorepo projects), it's recommended to do it on a module by module basis for faster transforms, e.g. `ignore: /node_modules[\/\\](?!some-module|other-module)/`. Example is using Regular Expressions negative lookahead.

  The Information about `Evaluator`, its default setting and custom implementations can be founded it [evaluators section of How it works docs](./HOW_IT_WORKS.md#evaluators)

  The default setup is:

  ```js
  [
    {
      action: require('linaria/evaluators').shaker,
    },
    {
      test: /\/node_modules\//,
      action: 'ignore',
    },
  ];
  ```

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

Now in your `preact.config.js`, we will modify the babel rule to use the necessary loaders and presets. Add the following:

```js
export default config => {
  const { options, ...babelLoaderRule } = config.module.rules[0]; // Get the babel rule and options
  options.presets.push('@babel/preset-react', 'linaria/babel'); // Push the necessary presets
  config.module.rules[0] = {
    ...babelLoaderRule,
    loader: undefined, // Disable the predefined babel-loader on the rule
    use: [
      {
        loader: 'babel-loader',
        options
      },
      {
        loader: 'linaria/loader',
        options: {
          babelOptions: options // Pass the current babel options to linaria's babel instance
        }
      }
    ]
  };
};
```

> If you wish to work with TypeScript, add the `@babel/preset-typescript` preset before `@babel/preset-react`.

After all of that, you should be able to run `npm build`, and it should have no errors.

To test that everthing is working, go to a file, for example `components/Header/index.js`, and create a class name.

```js
import { h } from 'preact';
import { Link } from 'preact-router/match';
import style from './style.css';

import { css } from 'linaria';

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

## Gatsby

If you wish you use Gatsby, we recommend you to use the `gatsby-cli` and start from there. The following configuration assumes you are using the default template provided by gatsby-cli. Start by creating your project using:

```
npx gatsby new my-project
```

Now, you have two options. You can use `gatsby-plugin-linaria` or create a custom config.

### gatsby-plugin-linaria

This is an easier and more straightforward way of integrating Linaria with Gatsby. Check [plugin docs](https://github.com/silvenon/gatsby-plugin-linaria) for instructions.

You can also take a look at the example [here](../examples/gatsby/plugin)

### Custom config

This is a bit more advanced way of integrating Linaria into your Gatsby project.

First, you will need to install `linaria` and `babel-preset-gatsby`. Then, create `babel.config.js` in the root of your project with the following contents:

```js
module.exports = {
  presets: [
    'babel-preset-gatsby',
    [
      'linaria/babel',
      {
        evaluate: true,
        displayName: process.env.NODE_ENV !== 'production',
      },
    ],
  ],
};
```

You can read more about configuring Babel in Gatsby projects in [their docs](https://www.gatsbyjs.org/docs/babel/).

Besides that, you will need to alter Gatsby's Webpack config to modify the Babel loader. This can be done in `gatsby-node.js` file. Consider the following snippet:

```js
exports.onCreateWebpackConfig = ({ actions, loaders, getConfig, stage }) => {
  const config = getConfig();

  config.module.rules = [
    ...config.module.rules.filter(
      rule => String(rule.test) !== String(/\.js?$/)
    ),

    {
      ...loaders.js(),

      test: /\.js?$/,
      loader: 'linaria/loader',
      options: {
        sourceMap: stage.includes('develop'),
        displayName: stage.includes('develop'),
        babelOptions: {
          presets: ['babel-preset-gatsby'],
        },
      },
      exclude: /node_modules/,
    },
  ];

  actions.replaceWebpackConfig(config);
};
```

If you want to know more about extending Webpack config in Gatsby projects, check out [relevant Gatsby docs](https://www.gatsbyjs.org/docs/add-custom-webpack-config/).

With that done, you should be all set! You can take a look at the minimal example using the above configuration [here](../examples/gatsby/custom-config).
