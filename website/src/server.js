/* @flow */
/* linaria-preval */
import fs from 'fs';
import express from 'express';
import compression from 'compression';
import crypto from 'crypto';
import dedent from 'dedent';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { collect } from 'linaria/server';
import App from './App';
import globalStyles from './styles/global';

const cache = {};
const css = fs.readFileSync('./static/styles.css', 'utf8');
const app = express();

app.get('/', (req, res) => {
  const html = ReactDOMServer.renderToStaticMarkup(<App />);
  const { critical, other } = collect(html, css);
  const slug = crypto
    .createHash('md5')
    .update(other)
    .digest('hex');

  cache[slug] = other;

  res.end(dedent`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>Linaria – zero-runtime CSS in JS library</title>

        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Montserrat:300,600">
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Fira+Mono">

        <style type="text/css">${globalStyles}</style>
        <style type="text/css">${critical}</style>

        <script defer src="/build/manifest.js"></script>
        <script defer src="/build/vendor.js"></script>
        <script defer src="/build/main.js"></script>
      </head>
      <body>
        <div id="root">${html}</div>

        <link rel="stylesheet" href="/vendor/prism.css">
        <link rel="stylesheet" href="/styles/${slug}">
      </body>
    </html>
  `);
});

app.use(compression());
app.use('/build', express.static('static/build'));
app.use('/vendor', express.static('static/vendor'));
app.use('/images', express.static('static/images'));
app.get('/styles/:slug', (req, res) => {
  res.type('text/css');
  res.end(cache[req.params.slug]);
});
app.listen(3242);

console.log('Listening on http://localhost:3242');
