---
title: Get started
link: get-started
---

# Get started

## Installation

```sh
npm install linaria
```

or

```sh
yarn add linaria
```

## Setup

Linaria currently supports webpack and Rollup to extract the CSS at build time. To configure your bundler, check the following guides:

- [webpack](/bundlers-integration#webpack)
- [Rollup](/bundlers-integration#rollup)

Optionally, add the `linaria/babel` preset to your Babel configuration at the end of the presets list to avoid errors when importing the components in your server code or tests:

```json
{
  "presets": [
    "@babel/preset-env",
    "@babel/preset-react",
    "linaria/babel"
  ]
}
```

See [Configuration](/configuration) to customize how Linaria processes your files.
