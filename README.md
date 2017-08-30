# Linaria

Fast zero-runtime CSS in JS library.


## Features

1. CSS is extracted at build time, no runtime is included
1. JavaScript expressions are supported and evaluated at build time
1. Critical CSS can be extracted for inlining during SSR
1. Familiar CSS syntax with Sass like nesting

## Usage

CSS rule declarations use tagged template litreals which produce a class name for use. In any JS file:

```js
import React from 'react';
import { css, include, names } from 'linaria';
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
  ${include(title)}

  font-family: ${fonts.heading};
  font-size: ${modularScale(2)};

  [data-theme=dark] & { color: ${colors.white} }

  [data-theme=light] & { color: ${colors.black} }

  ${hiDPI(1.5)} {
    font-size: ${modularScale(2.5)}
  }
`;

export default function Header({ className }) {
  return (
    <div className={names(container, className)}>
      <h1 className={header} />
    </div>
  );
}

export function Block() {
  return <div className={container} />;
}

export function App() {
  return <Header className={title} />;
}
```

After being transpiled, the code will output following CSS:


```css
.title_jt5ry4 {
  text-transform: uppercase;
}

.container_jdh5rtz {
  padding: 3em;
}

.header_xy4ertz {
  text-transform: uppercase;
  font-family: Helvetica, sans-serif; /* constants are automatically inlined */
  font-size: 2.66em;
}

[data-theme=dark] .header_xy4ertz {
  color: #fff;
}

[data-theme=light] .header_xy4ertz {
  color: #222;
}

@media only screen and (min-resolution: 144dpi), only screen and (min-resolution: 1.5dppx) {
  .header_xy4ertz {
    font-size: 3.3325em;
  }
}
```

And the following JavaScipt:

```js
import React from 'react';
import names from 'linaria/build/names';

const title = 'title_jt5ry4';

const container = 'container_jdh5rtz';

const header = 'header_xy4ertz';

export default function Header({ className }) {
  return (
    <div className={names(container, className)}>
      <h1 className={header} />
    </div>
  );
}

export function Block() {
  return <div className={container} />;
}

export function App() {
  return <Header className={title} />;
}
```


## Animations

We could declare CSS animation like so:

```js
const box = css`
  animation: rotate 1s linear infinite;

  @keyframes rotate {
    { from: 0deg }
    { to: 360deg }
  }
`
```

The animation name is always scoped to the selector.


## Dynamic styles

Sometimes we have some styles based on component's props or state, or dynamic in some way. Dynamic styles can be achieved with inline styles:

```js
<div style={{ transform: `translateX(${props.index * 100}%)` }}
```


## Server rendering

Even with fully static CSS, we have an opportunity to improve the initial page load by inlining critical CSS.

```js
import crypto from 'crypto';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { collect } from 'linaria/server';
import App from './App';

const cache = {};

const css = fs.readFileSync('./dist/styles.css', 'utf8');
const app = express();

app.get('/', (req, res) => {
  const html = ReactDOMServer.renderToString(<App />);
  const { critical, other }  = collect(html, css);
  const slug = crypto.createHash('md5').update(other).digest('hex');;

  cache[slug] = other;

  res.end(`
    <html lang='en'>
      <head>
        <title>App</title>
        <style type='text/css'>${critical}</style>
      </head>
      <body>
        <div id='root'>${html}</div>
        <link rel='css' href='/styles/${slug}' />
      </body>
    </html>
  `);
});

app.get('/styles/:slug', (req, res) =>
  res.end(cache[req.params.slug])
);

app.listen(3242);
```

We probably should write these CSS chunks to disk and serve them with correct headers for caching.


## Inspiration

1. [glamor](https://github.com/threepointone/glamor)
1. [styled-components](https://github.com/styled-components/styled-components)
1. [css-literal-loader](https://github.com/4Catalyzer/css-literal-loader)

## Contributors

Thanks goes to these wonderful people ([emoji key](https://github.com/kentcdodds/all-contributors#emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
| [<img src="https://avatars2.githubusercontent.com/u/17573635?v=4" width="100px;"/><br /><sub>Paweł Trysła</sub>](https://twitter.com/_zamotany)<br />[💻](https://github.com/satya164/linara/commits?author=zamotany "Code") [📖](https://github.com/satya164/linara/commits?author=zamotany "Documentation") [🤔](#ideas-zamotany "Ideas, Planning, & Feedback") | [<img src="https://avatars2.githubusercontent.com/u/1174278?v=4" width="100px;"/><br /><sub>Satyajit Sahoo</sub>](https://medium.com/@satya164)<br />[💻](https://github.com/satya164/linara/commits?author=satya164 "Code") [🤔](#ideas-satya164 "Ideas, Planning, & Feedback") | [<img src="https://avatars2.githubusercontent.com/u/5106466?v=4" width="100px;"/><br /><sub>Michał Pierzchała</sub>](https://github.com/thymikee)<br />[💻](https://github.com/satya164/linara/commits?author=thymikee "Code") [📖](https://github.com/satya164/linara/commits?author=thymikee "Documentation") [🤔](#ideas-thymikee "Ideas, Planning, & Feedback") |
| :---: | :---: | :---: |
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/kentcdodds/all-contributors) specification. Contributions of any kind welcome!
