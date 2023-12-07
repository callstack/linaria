"use strict";

require("ignore-styles");
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _crypto = _interopRequireDefault(require("crypto"));
var _server = require("@linaria/server");
var _koa = _interopRequireDefault(require("koa"));
var _koaRouter = _interopRequireDefault(require("koa-router"));
var _koaCompress = _interopRequireDefault(require("koa-compress"));
var _koaSend = _interopRequireDefault(require("koa-send"));
var _dedent = _interopRequireDefault(require("dedent"));
var _react = _interopRequireDefault(require("react"));
var _server2 = _interopRequireDefault(require("react-dom/server"));
var _serve = _interopRequireDefault(require("../serve.config"));
var _App = _interopRequireDefault(require("./components/App"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const cache = {};
const css = _fs.default.readFileSync(_path.default.join(__dirname, '../dist/styles.css'), 'utf8');
const app = new _koa.default();
const router = new _koaRouter.default();
app.use((0, _koaCompress.default)());
router.get('/', async ctx => {
  const html = _server2.default.renderToStaticMarkup( /*#__PURE__*/_react.default.createElement(_App.default, null));
  const {
    critical,
    other
  } = (0, _server.collect)(html, css);
  const slug = _crypto.default.createHash('md5').update(other).digest('hex');
  cache[slug] = other;
  ctx.type = 'html';
  ctx.body = (0, _dedent.default)`
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
router.get('/dist/:path+', async ctx => {
  await (0, _koaSend.default)(ctx, _path.default.join('dist', ctx.params.path));
});
router.get('/styles/:slug', async ctx => {
  ctx.type = 'text/css';
  ctx.body = cache[ctx.params.slug];
});
app.use(router.routes());
app.listen(_serve.default.port);

// eslint-disable-next-line no-console
console.log(`Listening on http://localhost:${_serve.default.port}`);