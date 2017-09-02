[![Build Status][build-badge]][build]
[![Code Coverage][coverage-badge]][coverage]
[![Version][version-badge]][package]
[![MIT License][license-badge]][license]

# Linaria

Zero-runtime CSS in JS library.

## Features

* Familiar CSS syntax with Sass like nesting.
* CSS is extracted at build time, no runtime is included.
* JavaScript expressions are supported and evaluated at build time.
* Critical CSS can be extracted for inlining during SSR.
* Integrates with existing tools like Webpack to provide features such as Hot Reload.

## Installation

Install it like a regular npm package:

```bash
yarn add linaria
```

Adjust the preset entry in your `.babelrc` file to look like:

```json
{
  "presets": [
    "env",
    "react",
    ["linaria/babel", {
      "single": true,
      "filename": "styles.css",
      "outDir": "dist"
    }]
  ]
}
```

## How it works

Linaria lets you write CSS code in a tagged template literal in your JavaScript files. The Babel plugin extracts the CSS rules to real CSS files, and generates unique class names to use.

Example is worth a thousand words:

```js
import React from 'react';
import { css, include, styles } from 'linaria';
import { modularScale, hiDPI } from 'polished';
import fonts from './fonts';
import colors from './colors';

const title = css`
  text-transform: uppercase;
`;

const container = css`
  padding: 3em;
`;

const header = css`
  ${include(title)};

  font-family: ${fonts.heading};
  font-size: ${modularScale(2)};

  ${hiDPI(1.5)} {
    font-size: ${modularScale(2.5)}
  }
`;

export default function Header({ className }) {
  return (
    <div {...styles(container, className)}>
      <h1 {...styles(header)} />
    </div>
  );
}

export function Block() {
  return <div {...styles(container)} />;
}

export function App() {
  return <Header {...styles(title)} />;
}
```

After being transpiled, the code will output following CSS:


```css
.title__jt5ry4 {
  text-transform: uppercase;
}

.container__jdh5rtz {
  padding: 3em;
}

.header__xy4ertz {
  text-transform: uppercase;
  font-family: Helvetica, sans-serif; /* constants are automatically inlined */
  font-size: 2.66em;
}

@media only screen and (min-resolution: 144dpi), only screen and (min-resolution: 1.5dppx) {
  .header__xy4ertz {
    font-size: 3.3325em;
  }
}
```

And the following JavaScipt:

```js
import React from 'react';
import { styles } from 'linaria/build/index.runtime';

const title = 'title__jt5ry4';

const container = 'container__jdh5rtz';

const header = 'header__xy4ertz';

export default function Header({ className }) {
  return (
    <div {...styles(container, className)}>
      <h1 {...styles(header)} />
    </div>
  );
}

export function App() {
  return <Header {...styles(title)} />;
}
```

## Trade-offs

* Dynamic styles are not supported with `css` tag. See [Dynamic Styles](/docs/DYNAMIC_STYLES.md) for alternative approaches.
* Modules used in the CSS rules cannot have side-effects.
  For example:

  ```js
  import { css } from 'linaria';
  import colors from './colors';

  const title = css`
    color: ${colors.text};
  `;
  ```
  Here, there should be no side-effects in the `colors.js` file, or any file it imports. We recommend to move helpers and shared configuration to files without any side-effects.

## Editor Plugins

### VSCode

* Syntax Highlighting - [Styled Components Plugin](https://marketplace.visualstudio.com/items?itemName=jpoissonnier.vscode-styled-components)

### Atom

* Syntax Highlighting - [Babel Grammar](https://atom.io/packages/language-babel)

## Recommended Libraries

* [polished.js](polished.js.org) - A lightweight toolset for writing styles in JavaScript.

## Documentation

* [API and usage](/docs/API.md)
* [Configuring Babel](/docs/BABEL_PRESET.md)
* [Dynamic Styles](/docs/DYNAMIC_STYLES.md)
* [Theming](/docs/THEMING.md)
* [Server Rendering](/docs/SERVER_RENDERING.md)
* [Bundlers integration](/docs/BUNDLERS_INTEGRATION.md)
* [Example](/example)

## Inspiration

1. [glam](https://github.com/threepointone/glam)
1. [styled-components](https://github.com/styled-components/styled-components)
1. [css-literal-loader](https://github.com/4Catalyzer/css-literal-loader)

## Contributors

Thanks goes to these wonderful people ([emoji key](https://github.com/kentcdodds/all-contributors#emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
| [<img src="https://avatars2.githubusercontent.com/u/17573635?v=4" width="100px;"/><br /><sub>Paweł Trysła</sub>](https://twitter.com/_zamotany)<br />[💻](https://github.com/satya164/linara/commits?author=zamotany "Code") [📖](https://github.com/satya164/linara/commits?author=zamotany "Documentation") [🤔](#ideas-zamotany "Ideas, Planning, & Feedback") | [<img src="https://avatars2.githubusercontent.com/u/1174278?v=4" width="100px;"/><br /><sub>Satyajit Sahoo</sub>](https://medium.com/@satya164)<br />[💻](https://github.com/satya164/linara/commits?author=satya164 "Code") [🤔](#ideas-satya164 "Ideas, Planning, & Feedback") | [<img src="https://avatars2.githubusercontent.com/u/5106466?v=4" width="100px;"/><br /><sub>Michał Pierzchała</sub>](https://github.com/thymikee)<br />[💻](https://github.com/satya164/linara/commits?author=thymikee "Code") [📖](https://github.com/satya164/linara/commits?author=thymikee "Documentation") [🤔](#ideas-thymikee "Ideas, Planning, & Feedback") |
| :---: | :---: | :---: |
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/kentcdodds/all-contributors) specification. Contributions of any kind welcome!

[build-badge]: https://img.shields.io/circleci/project/github/callstack-io/linaria/master.svg?style=flat-square
[build]: https://circleci.com/gh/callstack-io/linaria
[coverage-badge]: https://img.shields.io/codecov/c/github/callstack-io/linaria.svg?style=flat-square
[coverage]: https://codecov.io/github/callstack-io/linaria
[version-badge]: https://img.shields.io/npm/v/linaria.svg?style=flat-square
[package]: https://www.npmjs.com/package/linaria
[license-badge]: https://img.shields.io/npm/l/linaria.svg?style=flat-square
[license]: https://opensource.org/licenses/MIT
