<p align="center">
  <img alt="Linaria" src="website/static/images/linaria-logo@2x.png" width="496">
</p>

<p align="center">
Zero-runtime CSS in JS library.
</p>

---

[![Build Status][build-badge]][build]
[![Code Coverage][coverage-badge]][coverage]
[![Version][version-badge]][package]
[![MIT License][license-badge]][license]


[![All Contributors][all-contributors-badge]](#contributors)
[![PRs Welcome][prs-welcome-badge]][prs-welcome]
[![Chat][chat-badge]][chat]
[![Code of Conduct][coc-badge]][coc]

[![tweet][tweet-badge]][tweet]

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

Add the `linaria/babel` preset to your Babel configuration:

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

See [Configuring Babel](/docs/BABEL_PRESET.md) for more options and [Bundlers integration](/docs/BUNDLERS_INTEGRATION.md) for integrating with Webpack.

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

## Documentation

* [API and usage](/docs/API.md)
* [Configuring Babel](/docs/BABEL_PRESET.md)
* [Dynamic Styles](/docs/DYNAMIC_STYLES.md)
* [Theming](/docs/THEMING.md)
* [Server Rendering](/docs/SERVER_RENDERING.md)
* [Bundlers integration](/docs/BUNDLERS_INTEGRATION.md)
* [Example](/website)

## Editor Plugins

### VSCode

* Syntax Highlighting - [Styled Components Plugin](https://marketplace.visualstudio.com/items?itemName=jpoissonnier.vscode-styled-components)

### Atom

* Syntax Highlighting - [Babel Grammar](https://atom.io/packages/language-babel)

## Recommended Libraries

* [linaria-jest](https://github.com/thymikee/linaria-jest) – Jest testing utilities for Linaria.
* [polished.js](https://polished.js.org/) - A lightweight toolset for writing styles in JavaScript.

## Inspiration

* [glam](https://github.com/threepointone/glam)
* [styled-components](https://github.com/styled-components/styled-components)
* [css-literal-loader](https://github.com/4Catalyzer/css-literal-loader)

## Acknowledgements

This project wouldn't have been possible without the following libraries or the people behind them.

* [babel](https://babeljs.io/)
* [babel-plugin-preval](https://github.com/kentcdodds/babel-plugin-preval)
* [stylis.js](https://github.com/thysultan/stylis.js)

Special thanks to [@kentcdodds](https://github.com/kentcdodds) for his babel plugin and [@threepointone](https://github.com/threepointone) for his suggestions and encouragement.

## Contributors

Thanks goes to these wonderful people ([emoji key](https://github.com/kentcdodds/all-contributors#emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
| [<img src="https://avatars2.githubusercontent.com/u/17573635?v=4" width="100px;"/><br /><sub>Paweł Trysła</sub>](https://twitter.com/_zamotany)<br />[💻](https://github.com/satya164/linara/commits?author=zamotany "Code") [📖](https://github.com/satya164/linara/commits?author=zamotany "Documentation") [🤔](#ideas-zamotany "Ideas, Planning, & Feedback") | [<img src="https://avatars2.githubusercontent.com/u/1174278?v=4" width="100px;"/><br /><sub>Satyajit Sahoo</sub>](https://medium.com/@satya164)<br />[💻](https://github.com/satya164/linara/commits?author=satya164 "Code") [🤔](#ideas-satya164 "Ideas, Planning, & Feedback") | [<img src="https://avatars2.githubusercontent.com/u/5106466?v=4" width="100px;"/><br /><sub>Michał Pierzchała</sub>](https://github.com/thymikee)<br />[💻](https://github.com/satya164/linara/commits?author=thymikee "Code") [📖](https://github.com/satya164/linara/commits?author=thymikee "Documentation") [🤔](#ideas-thymikee "Ideas, Planning, & Feedback") | [<img src="https://avatars1.githubusercontent.com/u/1909761?v=4" width="100px;"/><br /><sub>Lucas</sub>](https://lcs.sh)<br />[📖](https://github.com/satya164/linara/commits?author=AgtLucas "Documentation") | [<img src="https://avatars0.githubusercontent.com/u/680439?v=4" width="100px;"/><br /><sub>Alexey Pronevich</sub>](https://github.com/pronevich)<br />[📖](https://github.com/satya164/linara/commits?author=pronevich "Documentation") | [<img src="https://avatars2.githubusercontent.com/u/18573330?v=4&s=460" width="100px;"/><br /><sub>Wojtek Szafraniec</sub>](https://github.com/wojteg1337)<br />[💻](https://github.com/satya164/linara/commits?author=wojteg1337 "Code") |
| :---: | :---: | :---: | :---: | :---: | :---: |
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/kentcdodds/all-contributors) specification. Contributions of any kind welcome!

<!-- badges -->
[build-badge]: https://img.shields.io/circleci/project/github/callstack/linaria/master.svg?style=flat-square
[build]: https://circleci.com/gh/callstack/linaria
[coverage-badge]: https://img.shields.io/codecov/c/github/callstack/linaria.svg?style=flat-square
[coverage]: https://codecov.io/github/callstack/linaria
[version-badge]: https://img.shields.io/npm/v/linaria.svg?style=flat-square
[package]: https://www.npmjs.com/package/linaria
[license-badge]: https://img.shields.io/npm/l/linaria.svg?style=flat-square
[license]: https://opensource.org/licenses/MIT
[prs-welcome-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs-welcome]: http://makeapullrequest.com
[coc-badge]: https://img.shields.io/badge/code%20of-conduct-ff69b4.svg?style=flat-square
[coc]: https://github.com/callstack/linaria/blob/master/CODE_OF_CONDUCT.md
[all-contributors-badge]: https://img.shields.io/badge/all_contributors-6-orange.svg?style=flat-square
[chat-badge]: https://img.shields.io/badge/chat-slack-brightgreen.svg?style=flat-square&colorB=E01563
[chat]: https://slack.callstack.io/
[tweet-badge]: https://img.shields.io/badge/tweet-%23linaria-blue.svg?style=flat-square&colorB=1DA1F2&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAUCAYAAACXtf2DAAAAAXNSR0IArs4c6QAAAaRJREFUOBGtlM8rBGEYx3cWtRHJRaKcuMtBSitxkCQ3LtzkP9iUUu5ODspRHLhRLtq0FxeicEBC2cOivcge%2FMgan3fNM8bbzL4zm6c%2BPT%2Fe7%2FO8887svrFYBWbbtgWzsAt3sAcpqJFxxF1QV8oJFqFPFst5dLWQAT87oTgPB7DtziFRT1EA4yZolsFkhwjGYFRO8Op0KD8HVe7unoB6PRTBZG8IctAmG1xrHcfkQ2B55sfI%2ByGMXSBqV71xZ8CWdxBxN6ThFuECDEAL%2Bc9HIzDYumVZ966GZnX0SzCZvEqTbkaGywkyFE6hKAsBPhFQ18uPUqh2ggJ%2BUor%2F4M%2F%2FzOC8g6YzR1i%2F8g4vvSI%2ByD7FFNjexQrjHd8%2BnjABI3AU4Wl16TuF1qANGll81jsi5qu%2Bw6XIsCn4ijhU5FmCJpkV6BGNw410hfSf6JKBQ%2FUFxHGYBnWnmOwDwYQ%2BwzdHqO75HtiAMJfaC7ph32FSRJCENUhDHsLaJkL%2FX4wMF4%2BwA5bgAcrZE4sr0Cu9Jq9fxyrvBHWbNkMD5CEHWTjjT2m6r5D92jfmbbKJEWuMMAAAAABJRU5ErkJggg%3D%3D
[tweet]: https://twitter.com/intent/tweet?text=Check%20out%20linaria!%20https://github.com/callstack/linaria%20%F0%9F%91%8D
