<p align="center">
  <img alt="Linaria" src="https://raw.githubusercontent.com/callstack/linaria/HEAD/website/assets/linaria-logo@2x.png" width="496">
</p>

<p align="center">
Zero-runtime CSS in JS library.
</p>

---

# @linaria/solid

### 📖 Please refer to the [GitHub](https://github.com/callstack/linaria#readme) for full documentation.

**[Why use Linaria](../../docs/BENEFITS.md)**

## Features

- supports a subset of `styled-components` syntax (`styled.div`, `styled(Component)`, property interpolations)

## Limitations

- does not support theming through arguments to property interpolations (yet)

## Installation

```sh
npm install @linaria/babel-preset @linaria/solid babel-preset-solid
```

or

```sh
yarn install @linaria/babel-preset @linaria/solid babel-preset-solid
```

## Configuration

For the time of this writing, `@linaria/solid` supports configuration only via babel configuration.
Just add `solid` to the `"presets"` section in your `babel.config.js` _after_ `"@linaria"`:

```json
{
  "presets": ["@linaria", "solid"]
}
```
