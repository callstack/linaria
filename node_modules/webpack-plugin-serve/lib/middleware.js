/*
  Copyright © 2018 Andrew Powell

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of this Source Code Form.
*/
const convert = require('koa-connect');
const historyApiFallback = require('connect-history-api-fallback');
const koaCompress = require('koa-compress');
const koaStatic = require('koa-static');
const onetime = require('onetime');
const httpProxyMiddleware = require('http-proxy-middleware');

const { middleware: wsMiddleware } = require('./ws');

let staticPaths = [];

const render404 = (ctx) => {
  const faqUrl =
    'https://github.com/shellscape/webpack-plugin-serve/blob/master/.github/FAQ.md#what-does-the-not-found--404-error-mean';
  const body = `<h1>Not Found / 404</h1>
<p>
  You may be seeing this error due to misconfigured options.<br/>
  Please see <a href="${faqUrl}">this FAQ question</a> for information on possible causes and remedies.
</p>
<h2>Static Paths</h2>
<code>${staticPaths.join('</code><code>')}</code>`;
  const css = `<style>
  @import url('https://fonts.googleapis.com/css?family=Open+Sans:400,700');

  *, html {
    font-size: 10px;
    margin: 0;
  }


  body {
    background: #282d35;
    color: #fff;
    font-family: 'Open Sans', Helvetica, Arial, sans-serif;
    padding: 2rem;
  }

  h1 {
    font-size: 5rem;
    padding-bottom: 2rem;
  }

  p {
    color: #eee;
    font-size: 1.6rem;
    padding: 1rem 0 3rem 0;
  }

  a, a:visited, a:hover {
    color: #ffbd2e;
    font-size: 1.6rem;
    text-decoration: none;
  }

  h2 {
    color: #eee;
    font-size: 1.5rem;
    padding: 1rem 0;
  }

  code {
    color: #eee;
    font-size: 1.4rem;
    padding: 0.4rem 1rem;
  }
</style>`;
  const html = `<!doctype><html><head>${css}</head><body>${body}</body></html>`;

  ctx.body = html; // eslint-disable-line no-param-reassign
  ctx.status = 404; // eslint-disable-line no-param-reassign
};

const getBuiltins = (app, options) => {
  const compress = (opts) => {
    // only enable compress middleware if the user has explictly enabled it
    if (opts || options.compress) {
      app.use(koaCompress(opts || options.compress));
    }
  };

  const four0four = (fn = () => {}) => {
    app.use(async (ctx, next) => {
      await next();
      if (ctx.status === 404) {
        render404(ctx);
        fn(ctx);
      }
    });
  };

  const headers = (reqHeaders) => {
    const headrs = reqHeaders || (options.headers || {});
    app.use(async (ctx, next) => {
      await next();
      for (const headr of Object.keys(headrs)) {
        ctx.set(headr, headrs[headr]);
      }
    });
  };

  const historyFallback = () => {
    if (options.historyFallback) {
      // https://github.com/shellscape/webpack-plugin-serve/issues/94
      // When using Firefox, the browser sends an accept header for /wps when using connect-history-api-fallback
      app.use(async (ctx, next) => {
        if (ctx.path.match(/^\/wps/)) {
          const { accept, ...reqHeaders } = ctx.request.header;
          ctx.request.header = reqHeaders; // eslint-disable-line no-param-reassign
        }
        await next();
      });

      app.use(convert(historyApiFallback(options.historyFallback)));
    }
  };

  const statik = (root, opts = {}) => {
    const paths = [].concat(root || options.static);
    staticPaths = paths;
    for (const path of paths) {
      app.use(koaStatic(path, opts));
    }
  };

  const proxy = (...args) => convert(httpProxyMiddleware(...args));
  const websocket = () => app.use(wsMiddleware);

  proxy.skip = true;

  // by default, middleware are executed in the order they appear here.
  // the order of the properties returned in this object are important.
  return {
    compress: onetime(compress),
    headers: onetime(headers),
    historyFallback: onetime(historyFallback),
    static: onetime(statik),
    websocket: onetime(websocket),
    proxy,
    four0four: onetime(four0four)
  };
};

module.exports = { getBuiltins };
