# Linaria

Fast zero-runtime CSS in JS library.


## Features

1. Familiar CSS syntax
1. CSS is extracted out to real CSS files
1. Class names are stay recognizable to what you wrote (with babel plugin)
1. SCSS like shorthand and nesting
1. Zero runtime in production
1. Server rendering for critical CSS
1. No configuration or build step required for development


## Usage

CSS rule declarations use tagged template litreals which produce a class name for use. In any JS file:

```js
import React from 'react';
import { css, include, names } from 'linaria';
import fonts from './fonts.js';
import colors from './colors.js';

const title = css`
  text-transform: uppercase;
`;

const container = css`
  height: 3rem;
`;

const header = css`
  ${include(title)}

  font-family: ${fonts.heading};
  font-size: 3rem;
  margin-bottom: .5rem;

  [data-theme=dark] & { color: ${colors.white} }

  [data-theme=light] & { color: ${colors.black} }

  @media (max-width: 320px) {
    font-size: 2rem;
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
  height: 3rem;
}

.header_xy4ertz {
  text-transform: uppercase;
  font-family: Helvetica, sans-serif; /* constants are automatically inlined */
  font-size: 3rem;
  margin-bottom: .5rem;
}

@media (max-width: 320px) {
  .header_xy4ertz {
    font-size: 2rem;
  }
}

[data-theme=dark] .header_xy4ertz {
  color: #fff;
}

[data-theme=light] .header_xy4ertz {
  color: #222;
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

Sometimes we have some styles based on component's props or state, or dynamic in some way. urrently dynamic styles could be acheived with inline styles:

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


## Challenges to solve

1. Theming should have a nicer API, the idea is to specify set of theme names, generate set of rules for each theme automatically and then change an attribute at application root to switch themes


## Inspiration

1. [glamor](https://github.com/threepointone/glamor)
1. [styled-components](https://github.com/styled-components/styled-components)
1. [css-literal-loader](https://github.com/4Catalyzer/css-literal-loader)
