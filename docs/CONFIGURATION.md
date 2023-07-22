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

- `variableNameConfig: "var" | "dashes" | "raw"` (default: `var`):

  Configures how the variable will be formatted in final CSS.

  ### Possible values

  #### `var`
  Use full css variable structure. This is default behavior.

  ```js
  import { styled } from "@linaria/react";

  export const MyComponent = styled.div`
    color: ${(props) => props.color};
  `;
  ```

  In CSS you will see full variable declaration

  ```css
  .MyComponent_m1cus5as {
    color: var(--m1cus5as-0);
  }
  ```

  #### `dashes`
  Removes `var()` around the variable name. It is useful when you want to control the variable on your own. For example you can set default value for CSS variable.

  ```js
  import { styled } from "@linaria/react";

  export const Theme = styled.div`
    --font-color: red;
  `;

  export const MyComponent = styled.div`
    // Returning empty string is mandatory
    // Otherwise you will have "undefined" in css variable value
    color: var(${(props) => props.color ?? ""}, var(--font-color));
  `;

  function App() {
    return (
      <Theme>
        <MyComponent>Text with red color</MyComponent>
        <MyComponent color="blue">Text with blue color</MyComponent>
      </Theme>
    );
  }
  ```

  In CSS you will see generated variable name and your default value.

  ```css
  .Theme_t1cus5as {
    --font-color: red;
  }

  .MyComponent_mc195ga {
    color: var(--mc195ga-0, var(--font-color));
  }
  ```

  #### `raw`
  Use only variable name without dashes and `var()` wrapper.

  ```js
  import { styled } from "@linaria/react";

  export const MyComponent = styled.div`
    color: ${(props) => props.color};
  `;
  ```

  In CSS you will see just the variable name. This is not valid value for css property.

  ```css
  .MyComponent_mc195ga {
    color: mc195ga-0;
  }
  ```

  You will have to make it valid:

  ```js
  export const MyComponent = styled.div`
    color: var(--${(props) => props.color});
  `;
  ```

- `classNameSlug: string | ((hash: string, title: string, args: ClassNameSlugVars) => string)` (default: `default`):

  Using this will provide an interface to customize the output of the CSS class name. Example:

      classNameSlug: '[title]',

  Would generate a class name such as `.header` instead of the default `.header_absdjfsdf` which includes a hash.

  You may also use a function to define the slug. The function will be evaluated at build time and must return a string:

      classNameSlug: (hash, title) => `${hash}__${7 * 6}__${title}`,

  Would generate the class name `.absdjfsdf__42__header`.

  Last argument `args` is an object that contains following properties: `title`, `hash`, `dir`, `ext`, `file`, `name`. These properties
  are useful when you want to generate your own hash:

  ```js
  const sha1 = require("sha1");

  module.exports = {
    classNameSlug: (hash, title, args) => sha1(`${args.name}-${title}`)
  };
  ```

  **note** invalid characters will be replaced with an underscore (`_`).

  ### Variables

  - `hash`: The hash of the content.
  - `title`: The name of the class.

- `variableNameSlug: string | ((context: IVariableContext) => string)` (default: `default`):

  Using this will provide an interface to customize the output of the CSS variable name. Example:

      variableNameSlug: '[componentName]-[valueSlug]-[index]',

  Would generate a variable name such as `--Title-absdjfsdf-0` instead of the `@react/styled`'s default `--absdjfsdf-0`.

  You may also use a function to define the slug. The function will be evaluated at build time and must return a string:

      variableNameSlug: (context) => `${context.valueSlug}__${context.componentName}__${context.precedingCss.match(/([\w-]+)\s*:\s*$/)[1]}`,

  Would generate the variable name `--absdjfsdf__Title__flex-direction`.

  **note** invalid characters will be replaced with an underscore (`_`).

  ### Variables

  - `componentName` - the displayName of the component.
  - `componentSlug` - the component slug.
  - `index` - the index of the css variable in the current component.
  - `precedingCss` - the preceding part of the css for the variable, i.e. `flex: 1; flex-direction: `.
  - `preprocessor` - the preprocessor used to process the tag (e.g. 'StyledProcessor' or 'AtomicStyledProcessor').
  - `source` - the string source of the css property value.
  - `unit` - the unit.
  - `valueSlug` - the value slug.

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
      action: require.resolve('@linaria/shaker'),
    },
    {
      test: /[\\/]node_modules[\\/]/,
      action: 'ignore',
    },
    {
      test: (filename, code) => {
        if (!/[\\/]node_modules[\\/]/.test(filename)) {
          return false;
        }
        
        return /\b(?:export|import)\b/.test(code);
      },
      action: require.resolve('@linaria/shaker'),
    }
  ];
  ```

- `tagResolver: (source, tag) => string`

  A custom function to use when resolving template tags.

  By default, linaria APIs like `css` and `styled` **must** be imported directly from the package – this is because babel needs to be able to recognize the API's to do static style extraction. `tagResolver` allows `css` and `styled` APIs to be imported from other files too.

  `tagResolver` takes the path for the source module (eg. `@linaria/core`) and the name of imported tag (eg. `css`), and returns the full path to the related processor. If `tagResolver` returns `null`, the default tag processor will be used.

  For example, we can use this to map `@linaria/core` , `@linaria/react` or `@linaria/atomic` where we re-export the module.

   ```js
   {
     tagResolver: (source, tag) => {
       const pathToLocalFile = join(__dirname, './my-local-folder/linaria.js');
       if (source === pathToLocalFile) {
         if (tag === 'css') {
           return require.resolve('@linaria/core/processors/css');
         }
  
         if (tag === 'styled') {
           return require.resolve('@linaria/react/processors/styled');
         }
       }
  
       return null;
     };
   }
   ```

  We can then re-export and use linaria API's from `./my-local-folder`:

   ```js
   // my-file.js
   import { css, styled } from './my-local-folder/linaria';

   export const MyComponent = styled.div`
      color: red;
   `;
  
   export default css`
     border: 1px solid black;
   `;
   ```

   ```js
   // ./my-local-folder/core.js
   export * from '@linaria/core';
   ```

- `babelOptions: Object`

  If you need to specify custom babel configuration, you can pass them here. These babel options will be used by Linaria when parsing and evaluating modules.

- `features: Record<string, FeatureFlag>`

  A map of feature flags to enable/disable. See [Feature Flags](./FEATURE_FLAGS.md##feature-flags) for more information.

## `@linaria/babel-preset`

The preset pre-processes and evaluates the CSS. The bundler plugins use this preset under the hood. You also might want to use this preset if you import the components outside of the files handled by your bundler, such as on your server or in unit tests.

To use this preset, add `@linaria/babel-preset` to your Babel configuration at the end of the presets list:

`.babelrc`:

```diff
{
  "presets": [
    "@babel/preset-env",
    "@babel/preset-react",
+   "@linaria"
  ]
}
```

The babel preset can accept the same options supported by the configuration file, however it's recommended to use the configuration file directly.

## Preact

If you wish you use Preact, we recommend you to use the `preact-cli` and start from there. The following configuration assumes you are using the default template provided by preact-cli. Start by creating your project using;

```
npx preact-cli create default my-project
```

On top of the default template, you will need to install `@babel/preset-react`. This is because Linaria works with JSX syntax. Otherwise, preact will throw an error saying that `@linaria/webpack-loader` can't parse JSX. Don't forget to install all required `@linaria`-packages!.

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
+   "@linaria/babel-preset": "^3.0.0",
+   "@linaria/core": "^3.0.0",
+   "@linaria/react": "^3.0.0",
+   "@linaria/webpack-loader": "^3.0.0",
    "preact": "^10.3.2",
    "preact-render-to-string": "^5.1.4",
    "preact-router": "^3.2.1"
  },
```

> If you wish to work with TypeScript, you will also need to install `@babel/preset-typescript`

Now in your `preact.config.js`, we will modify the babel rule to use the necessary loaders and presets. Add the following:

```js
export default (config) => {
  const { options, ...babelLoaderRule } = config.module.rules[0]; // Get the babel rule and options
  options.presets.push('@babel/preset-react', '@linaria'); // Push the necessary presets
  config.module.rules[0] = {
    ...babelLoaderRule,
    loader: undefined, // Disable the predefined babel-loader on the rule
    use: [
      {
        loader: 'babel-loader',
        options,
      },
      {
        loader: '@linaria/webpack-loader',
        options: {
          babelOptions: options, // Pass the current babel options to linaria's babel instance
        },
      },
    ],
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

import { css } from '@linaria/core';

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

> You can also use the `styled` variant, importing from `@linaria/react`.

If you run `npm run dev`, you should be able to see a button next to the nav title, with red bold text.

You can take a look at this example [here](../examples/Preact)

## Gatsby

If you wish you use Gatsby, we recommend you to use the `gatsby-cli` and start from there. The following configuration assumes you are using the default template provided by gatsby-cli. Start by creating your project using:

```
npx gatsby new my-project
```

Now, you have two options. You can use `gatsby-plugin-linaria` or create a custom config.

### gatsby-plugin-linaria

This is an easier and more straightforward way of integrating Linaria with Gatsby. Check [plugin docs](https://github.com/cometkim/gatsby-plugin-linaria) for instructions.

You can also take a look at the example [here](../examples/gatsby/plugin)

### Custom config

This is a bit more advanced way of integrating Linaria into your Gatsby project.

First, you will need to install `@linaria/babel-preset` and `babel-preset-gatsby`. Then, create `babel.config.js` in the root of your project with the following contents:

```js
module.exports = {
  presets: [
    'babel-preset-gatsby',
    [
      '@linaria',
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
      (rule) => String(rule.test) !== String(/\.js?$/)
    ),

    {
      ...loaders.js(),

      test: /\.js?$/,
      loader: '@linaria/webpack-loader',
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
