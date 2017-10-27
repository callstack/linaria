# Linting

## stylelint

For linting styles with [stylelint](https://stylelint.io/), we provide our custom config tailored for linaria - `linaria/stylelint-config` based on [`stylelint-config-recommended`](https://github.com/stylelint/stylelint-config-recommended).

### Installation

Both `stylelint` and `stylelint-config-recommended` are `peerDependencies` so you need to install them manually:

```bash
yarn add stylelint stylelint-config-recommended --dev
```

### Configuring stylelint

All you need to do is to set your config to extend from `linaria/stylelint-config`.

Here's the example `.stylelintrc` configuration file:

```json
{
  "extends": [
    "linaria/stylelint-config"
  ]
}
```

Please refer to the [official stylelint documentation](https://stylelint.io/user-guide/configuration/) for more info about configuration.

### Running the linter

Add the following to your `package.json` scripts:

```json
"lint:css": "stylelint src/**/*.js"
```

Now, you can run `yarn lint:css` to run the linter.

For more information refer to [stylelint documentation](https://stylelint.io/user-guide/cli/).
