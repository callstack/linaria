# Linting

There are separate installations based on whether you use stylelint v13 or stylelint v14

## Stylelint 13

For linting styles with [stylelint 13](https://stylelint.io/), use `@linaria/stylelint`.

### Installation

Install `stylelint` and optionally your favorite config (such as `stylelint-config-recommended`) in your project:

```bash
yarn add --dev stylelint stylelint-config-recommended @linaria/stylelint
```

### Configuring stylelint

All you need to do is to set your config to extend from `@linaria/stylelint`.

Here's the example `.stylelintrc` configuration file:

```json
{
  "extends": [
    "stylelint-config-recommended",
    "@linaria/stylelint"
  ]
}
```

Please refer to the [official stylelint documentation](https://stylelint.io/user-guide/configuration/) for more info about configuration.

The preprocessor will use the [options from the configuration file](/docs/CONFIGURATION.md) for processing your files.

## Stylelint 14

For linting styles with [stylelint 14](https://stylelint.io/), use `@linaria/stylelint-config-standard-linaria`.

### Installation

Install `stylelint` and `@linaria/stylelint-config-standard-linaria`

```bash
yarn add --dev stylelint @linaria/stylelint-config-standard-linaria
```

### Configuring stylelint

For the standard configuration you can extend from `@linaria/stylelint-config-standard-linaria`.

Here's an example `.stylelintrc` configuration file:

```json
{
  "extends": [
    "@linaria/stylelint-config-standard-linaria"
  ]
}
```

`@linaria/stylelint-config-standard-linaria` extends `stylelint-config-standard` which extends `stylelint-config-recommended` so you do NOT need to add those separately.  It also sets the customSyntax as `@linaria/postcss-linaria` and adds a few rules.

Alternatively, to just use the custom syntax you can add `@linaria/postcss-linaria`
Here's an example `.stylelintrc` configuration file:

```json
{
  "customSyntax": "@linaria/postcss-linaria"
}
```

Please refer to the [official stylelint documentation](https://stylelint.io/user-guide/configuration/) for more info about configuration.

### Why did the configuration change between Stylelint v13 and v14?

Stylelint 14 encourages the use of a [custom syntax](https://stylelint.io/developer-guide/syntaxes/) instead of a processor. `@linaria/stylelint-config-standard-linaria` sets the custom syntax to `@linaria/postcss-linaria`, a custom syntax for linaria, whereas @linaria/stylelint uses a processor.  The custom syntax has the benefit of being able to support `stylelint --fix` whereas the processor cannot.

## Usage

### Linting your files

Add the following to your `package.json` scripts:

```json
"lint:css": "stylelint src/**/*.js"
```

Now, you can run `yarn lint:css` to lint the CSS in your JS files with stylelint.

For more information refer to [stylelint documentation](https://stylelint.io/user-guide/cli/).

## Editor Setup

In order to make the
[vscode-stylelint](https://github.com/stylelint/vscode-stylelint)
extension work with this syntax correctly, you must configure it
to validate the files you use linaria in by specifying an array of [language 
identifiers](https://code.visualstudio.com/docs/languages/overview#_changing-the-language-for-the-selected-file).

You can do this by following these
[instructions](https://github.com/stylelint/vscode-stylelint#stylelintvalidate).

For example:

```json
{
  "stylelint.validate": ["typescriptreact"]
}
```

