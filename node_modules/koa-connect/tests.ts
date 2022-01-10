import Koa, { Context } from 'koa';
import supertest from 'supertest';
import c2k from './index';
import assert from 'assert';
import { IncomingMessage, ServerResponse } from 'http';
import * as bodyParser from 'body-parser';

describe.skip('koa-connect', () => {
  let app: Koa;

  beforeEach(() => {
    app = new Koa();
    app.use((ctx, next) => {
      ctx.status = 404;
      ctx.body = 'Original';
      return next();
    });
  });

  it('works with a single noop Connect middleware', (done) => {
    function noop(req: IncomingMessage, res: ServerResponse, next: () => void) {
      next();
    }
    app.use(c2k(noop));
    supertest(app.callback()).get('/').expect('Original').end(done);
  });

  it('works with two noop Connect middleware', (done) => {
    function noop(req: IncomingMessage, res: ServerResponse, next: () => void) {
      next();
    }
    app.use(c2k(noop));
    app.use(c2k(noop));
    supertest(app.callback()).get('/').expect('Original').end(done);
  });

  it('passes correctly to downstream Koa middlewares', (done) => {
    function noop(req: IncomingMessage, res: ServerResponse, next: () => void) {
      next();
    }
    function goodStatusSetter(ctx: Context) {
      ctx.status = 200;
    }
    app.use(c2k(noop));
    app.use(goodStatusSetter);
    supertest(app.callback()).get('/').expect(200).end(done);
  });

  it('bubbles back to earlier middleware', (done) => {
    let callOne = false;
    let callTwo = false;
    app.use((ctx, next) => {
      return next().then(() => {
        callTwo = true;
      });
    });

    app.use(
      c2k((req: IncomingMessage, res: ServerResponse) => {
        res.statusCode = 200;
        callOne = true;
      })
    );

    supertest(app.callback())
      .get('/')
      .expect(200)
      .then(() => {
        assert(callOne === true, 'Second middleware never called');
        assert(callTwo === true, 'Never bubbled back to first middleware');
        done();
      });
  });

  it('receives errors from Connect middleware', (done) => {
    app.use((ctx, next) => {
      next().catch((err) => (ctx.status = 505));
    });

    app.use(
      c2k((req, res, next) => {
        next(new Error('How Connect does error handling'));
      })
    );

    app.use((ctx) => {
      // Fail the test if this is reached
      done(new Error('Improper error handling'));
    });

    supertest(app.callback()).get('/').expect(505).end(done);
  });

  it('Setting the body or status in Koa middlewares does not do anything if res.end was used in a Connect middleware', (done) => {
    const message = 'The message that makes it';
    app.use((ctx, next) => {
      next().then(() => {
        if (ctx.status !== 200) {
          done(new Error('Never reached connect middleware'));
        }
        // These calls won't end up doing anything
        ctx.status = 500;
        ctx.body = 'A story already written';
      });
    });

    app.use(
      c2k((req: IncomingMessage, res: ServerResponse) => {
        res.statusCode = 200;
        res.setHeader('Content-Length', message.length);
        res.end(message);
      })
    );

    supertest(app.callback()).get('/').expect(200).expect(message).end(done);
  });
});

describe('integration tests', () => {
  let app: Koa;

  beforeEach(() => {
    app = new Koa();
  });

  it('works with body-parser', (done) => {
    const obj = { foo: '🦞' };
    app.use(c2k(bodyParser.json()));
    app.use((ctx, next) => {
      // TODO fix types, remove need for any
      const req = ctx.req as any;
      assert(req.body.foo === obj.foo);
      ctx.response.status = 200;
      next();
    });
    supertest(app.callback()).post('/').send(obj).expect(200).end(done);
  });
});
