const React = require('react')
const Koa = require('koa');
const Helmet = require('react-helmet').default;
const ReactDOMServer = require('react-dom/server');
const koaStatic = require('koa-static')
const koa = new Koa();
const App = require('./dist');

koa.use(koaStatic('dist'));

koa.use(async ctx => {
  const body = ReactDOMServer.renderToString(React.createElement(App));
  const helmet = Helmet.renderStatic();

  ctx.body = `<!doctype html>
<html ${helmet.htmlAttributes.toString()}>
    <head>
        ${helmet.title.toString()}
        ${helmet.meta.toString()}
        ${helmet.link.toString()}
    </head>
    <body ${helmet.bodyAttributes.toString()}>
        <div id="content">
          ${body}
        </div>
    </body>
</html>`;
});

koa.listen(3000);
console.log('Listening on port 3000')
