import 'ignore-styles';

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { collect } from '@linaria/server';
import Koa from 'koa';
import Router from 'koa-router';
import compress from 'koa-compress';
import send from 'koa-send';
import dedent from 'dedent';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import config from '../serve.config';
import App from './components/App';

const cache = {};
const css = fs.readFileSync(path.join(__dirname, '../dist/styles.css'), 'utf8');
const app = new Koa();
const router = new Router();

app.use(compress());

router.get('/', async (ctx) => {
  const html = ReactDOMServer.renderToStaticMarkup(<App />);

  const { critical, other } = collect(html, css);
  const slug = crypto.createHash('md5').update(other).digest('hex');

  cache[slug] = other;

  ctx.type = 'html';
  ctx.body = dedent`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>Linaria – zero-runtime CSS in JS library</title>

        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Montserrat:300,600">
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Fira+Mono">

        <style type="text/css">${critical}</style>
      </head>
      <body>
        <div id="root">${html}</div>

        <script src="/dist/app.bundle.js"></script>
        <link rel="stylesheet" href="/styles/${slug}">
      </body>
    </html>
  `;
});

router.get('/dist/:path+', async (ctx) => {
  await send(ctx, path.join('dist', ctx.params.path));
});

router.get('/styles/:slug', async (ctx) => {
  ctx.type = 'text/css';
  ctx.body = cache[ctx.params.slug];
});

app.use(router.routes());

app.listen(config.port);

// eslint-disable-next-line no-console
console.log(`Listening on http://localhost:${config.port}`);
