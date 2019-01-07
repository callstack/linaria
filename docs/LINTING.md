# Linting

## stylelint

For linting styles with [stylelint](https://stylelint.io/), we provide our custom config tailored for linaria - `linaria/stylelint-config`.

### Installation

You need to install `stylelint` and optionally your favorite config (such as `stylelint-config-recommended`) in your project:

```bash
yarn add --dev stylelint stylelint-config-recommended
```

### Configuring stylelint

All you need to do is to set your config to extend from `linaria/stylelint-config`.

Here's the example `.stylelintrc` configuration file:

```json
{
  "extends": [
    "stylelint-config-recommended",
    "linaria/stylelint-config"
  ]
}
```

Please refer to the [official stylelint documentation](https://stylelint.io/user-guide/configuration/) for more info about configuration.

The preprocessor will use the [options from the configuration file](/docs/CONFIGURATION.md) for processing your files.

### Linting your files

Add the following to your `package.json` scripts:

```json
"lint:css": "stylelint src/**/*.js"
```

Now, you can run `yarn lint:css` to lint the CSS in your JS files with stylelint.

For more information refer to [stylelint documentation](https://stylelint.io/user-guide/cli/).
