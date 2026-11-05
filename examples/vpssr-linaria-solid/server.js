import express from "express";
import compression from "compression";
import { createDevMiddleware, renderPage } from "vike/server";

const isProduction = process.env.NODE_ENV === "production";
const root = import.meta.dirname;

const app = express();
app.use(compression());

async function main () {
  if (isProduction) {
    const { default: sirv } = await import("sirv");
    app.use(sirv(`${root}/dist/client`));
  } else {
    const { devMiddleware } = await createDevMiddleware({ root });
    app.use(devMiddleware);
  }

  app.get("*", async (req, res, next) => {
    const pageContextInit = {
      urlOriginal: req.originalUrl,
    };
    const pageContext = await renderPage(pageContextInit);
    const { httpResponse } = pageContext;
    if (!httpResponse) return next();
    const { statusCode, headers, earlyHints } = httpResponse;
    if (res.writeEarlyHints)
      res.writeEarlyHints({ link: earlyHints.map((e) => e.earlyHintLink) });
    headers.forEach(([name, value]) => res.setHeader(name, value));
    res.status(statusCode);
    httpResponse.pipe(res);
  });

  const port = process.env.PORT || 3000;
  app.listen(port);
  console.log(`Server running at http://localhost:${port}`);
}
main()
