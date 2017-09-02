# Server rendering

If you're server rendering your app, we provide the `collect` method to extract the critical CSS so that you can ship the minimal amount of CSS used in the page to the browser.

The `collect` method takes some HTML and CSS and gives you the critical CSS.

```js
import { collect } from 'linaria/server';

const { critical, other }  = collect(html, css);
```

For example, in an express app with React, you could do something like the following:

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
        <div id='root'>
          ${html}
        </div>
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

By placing the non-critical CSS at the end of `body`, you can make sure that page rendering is not blocked till it has loaded. You can also load the non-critical CSS lazily with JavaScript once the page has loaded for a more efficient strategy.
