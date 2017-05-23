# Linaria

Fast zero-runtime CSS in JS library.


## Features

1. CSS is extracted out to real CSS files
1. Familiar CSS syntax
1. Class names are kept the same as what you wrote (with babel plugin)
1. SCSS like shorthand and nesting
1. Zero runtime in production
1. Server rendering for critical CSS


## Usage

CSS rule declarations use tagged template litreals which produce a class name for use. In any JS file:

```js
import React from 'react';
import { css, compose } from 'library';
import fonts from './fonts.js';
import colors from './colors.js';

const title = css`
  text-transform: uppercase;
`

const container = css`
  height: 3rem;
`

const header = css`
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
    <div className={compose(container, className)}>
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
.container.title[data-css~='Header__jdh5rtz'] {
  text-transform: uppercase;
}

.container[data-css~='Header__jdh5rtz'],
.container[data-css~='Block__jdh5rtz'] {
  height: 3rem;
}

.header[data-css~='Header__xy4ertz'] {
  font-family: Helvetica, sans-serif; /* constants are automatically inlined */
  font-size: 3rem;
  margin-bottom: .5rem;
}

@media (max-width: 320px) {
  .header[data-css~='Header__xy4ertz'] {
    font-size: 2rem;
  }
}

[data-theme=dark] .header[data-css~='Header__xy4ertz'] {
  color: #fff;
}

[data-theme=light] .header[data-css~='Header__xy4ertz'] {
  color: #222;
}
```

And the following JavaScipt:

```js
import React from 'react';

export default function Header({ className, dataCss }) {
  return (
    <div dataCss={'Header__jdh5rtz ' + dataCss} className={'container' + ' ' + className)}>
      <h1 dataCss="Header__xy4ertz" className="header" />
    </div>
  );
}

export function Block() {
  return <div dataCss="Block__jdh5rtz" className="container" />;
}

export function App() {
  return <Header dataCss="Block__jdh5rtz" className="title" />;
}
```

In a React app, scoping styles is done by inserting `data-css` attributes in the components. When not using React or when no React component is found in the file, a hash can be prepended to the class name for scoping.


## Animations

You could declare CSS animation like so:

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


## Server rendering

Even with fully static CSS, we have an opportunity to improve the initial page load by inlining critical CSS.

```js
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { collect, slugify } from 'library';
import App from './App';

const cache = {};

const css = fs.readFileSync('./dist/styles.css').toString();
const app = express();

app.get('/', (req, res) => {
  const html = ReactDOMServer.renderToString(<App />);
  const { critical, other }  = collect(html, css);
  const slug = slugify(other);

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

You probably should write these CSS chunks to disk and serve them with correct headers for caching.


## Challenges to solve

1. When composing multiple class names, we deliberately need to increase the specificity of the class names towards the end, this can be tricky since we need to track the places using multiple class names by following the component's import.
1. Theming should have a nicer API, the idea is to specify set of theme names, generate set of rules for each theme automatically and then change an attribute at application root to switch themes
1. It'll be nicer to figure out common CSS for all pages in server rendering and then ship page specific CSS inline
