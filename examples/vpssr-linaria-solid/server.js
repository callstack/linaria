const express = require("express");
const compression = require("compression");
const { renderPage } = require("vite-plugin-ssr");

const isProduction = process.env.NODE_ENV === "production";

const app = express();
app.use(compression());

async function main () {
  if (isProduction) {
    const sirv = require("sirv")
    app.use(sirv(`${__dirname}/dist/client`));
  } else {
    const vite = require("vite");
    const server = await vite.createServer({
      root: __dirname,
      configFile: './vite.config.js',
      server: { middlewareMode: true },
    })
    app.use(server.middlewares);
  }

  app.get("*", async (req, res, next) => {
    const pageContextInit = {
      urlOriginal: req.originalUrl,
    };
    const pageContext = await renderPage(pageContextInit);
    const { httpResponse } = pageContext;
    if (!httpResponse) return next();
    const { statusCode, contentType, earlyHints } = httpResponse;
    if (res.writeEarlyHints)
      res.writeEarlyHints({ link: earlyHints.map((e) => e.earlyHintLink) });
    res.status(statusCode).type(contentType);
    httpResponse.pipe(res);
  });

  const port = process.env.PORT || 3000;
  app.listen(port);
  console.log(`Server running at http://localhost:${port}`);
}
main()
