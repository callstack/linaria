# Documentation

## API

Linaria exposes a core `css` method alongside with small, but just enough amount of helpers. Inside `linaria` module you can find following methods:

#### css(template: string[], ...expressions: string[]) => string

Takes template string literal and returns a unique class name to be used e.g. by `linaria/babel` plugin.

```js
import { css } from 'linaria';

const flower = css`
  display: inline;
  color: violet,
`;
// flower === css__9o5awv -> without babel plugin applied
// flower === flower__9o5awv –> with babel plugin
```

#### names(...classNames: string[]) => string

This is basically `classnames`:

```js
import { css, names } from 'linaria';

const cat = css`
  font-weight: bold;
`;

const yarn = css`
  color: violet;
`;

function App() {
  return <Playground className={names(cat, yarn)} />;
}
```

#### styles(...classNames: string[]) => { className: string }

Similar to `names`, but it also lets you write less code thanks to object destructuring.

```js
import { css, styles } from 'linaria';

const container = css`
  max-width: 1337px;
`

export function Block({ className }) => {
  return <div {...styles(container, className)} />;
}
```

#### include(...classNames: string[]) => string

```js
import { css, include } from 'linaria';

const width = 100;

const text = css`
  font-weight: 400;
`;

const title = css`
  @media (max-width: ${width}px) {
    font-family: monospace;
  }
`;

const header = css`
  ${include(text, title)};

  font-family: sans-serif;
`;
```

#### collect(html: string, css: string) => string

This is API available through `linaria/server` module and is intended to extract CSS from given HTML, when doing server side rendering (SSR).

```js
import { collect } from 'linaria/server';

const css = fs.readFileSync('./dist/styles.css', 'utf8');
const html = ReactDOMServer.renderToString(<App />);
const { critical, other } = collect(html, css);

// critical – returns critical CSS for given html
// other – returns the rest of styles
```

## Guides and examples

### Animations

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

### Dynamic styles

Sometimes we have some styles based on component's props or state, or dynamic in some way – to achieve it, use inline styling explicitly:

```js
<div style={{ transform: `translateX(${props.index * 100}%)` }}
```

### Server rendering

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
  const slug = crypto.createHash('md5').update(other).digest('hex');

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
