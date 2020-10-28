# Critical CSS extraction

Since Linaria extracts the CSS statically at build time, you don't need to setup a server rendering. Usually, critical CSS extraction will be automatic if you are code splitting your code and using something like [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin) for webpack to generate your CSS files.

If you're not code splitting, or the initial CSS chunk is not representative of initially rendered content, you might want to extract critical CSS using the `collect` helper we provide to ship the minimal amount of CSS used in the page to the browser. To be able to use the `collect` helper, you need to provide the initial HTML, which usually means that you need to have SSR setup for your web app.

The `collect` method takes some HTML and CSS and gives you the critical CSS:

```js
import { collect } from '@linaria/server';

const { critical, other }  = collect(html, css);
```

For example, in an express app with React, you could do something like the following:

```js
import fs from 'fs';
import express from 'express';
import crypto from 'crypto';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { collect } from '@linaria/server';
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
    <html lang="en">
      <head>
        <title>App</title>
        <style type="text/css">${critical}</style>
      </head>
      <body>
        <div id="root">
          ${html}
        </div>
        <link rel="css" href="/styles/${slug}" />
      </body>
    </html>
  `);
});

app.get('/styles/:slug', (req, res) => {
  res.type('text/css');
  res.end(cache[req.params.slug])
});

app.listen(3242);
```

By placing the non-critical CSS at the end of `body`, you can make sure that page rendering is not blocked until the CSS is loaded. You can also load the non-critical CSS lazily with JavaScript once the page has loaded for a more efficient strategy. However, it's highly recommended that you take advantage of code splitting in webpack which gives you automatic CSS chunks in addition to critical CSS.
