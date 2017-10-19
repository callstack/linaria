# Linting

## stylelint

For linting styles with [stylelint](https://stylelint.io/), we provide our custom preprocessor (`linaria/stylelint-preprocessor`) and a basic config tailored for linaria - `linaria/stylelint-config` based on [`stylelint-config-recommended`](https://github.com/stylelint/stylelint-config-recommended).

### Installation

Both `stylelint` and `stylelint-config-recommended` are `peerDependencies` so you need to install them manually:

```bash
yarn add stylelint stylelint-config-recommended --dev
```

### Configuring stylelint

First of all, you need to add `linaria/stylelint-preprocessor` to the `preprocessors` array in your stylelint configuration as well as set `syntax` to `scss`.

Please refer to the [official stylelint documentation](https://stylelint.io/user-guide/configuration/) for more info about configuration.

We strongly recommend to use our `linaria/stylelint-config` to provide sensible defaults for linting.

Here's the example `.stylelintrc` configuration file:

```json
{
  "processors": ["linaria/stylelint-preprocessor"],
  "syntax": "scss",
  "extends": [
    "linaria/stylelint-config"
  ]
}
```

### Running the linter

Add the following to your `package.json` scripts:

```json
"lint:css": "stylelint src/**/*.js"
```

Now, you can run `yarn lint:css` to run the linter.

For more information refer to [stylelint documentation](https://stylelint.io/user-guide/cli/).
