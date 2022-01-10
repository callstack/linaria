'use strict';

const Koa = require('koa');
const supertest = require('supertest');
const c2k = require('..');

describe('koa-connect', () => {
  let app;

  beforeEach(() => {
    app = new Koa();
    app.use( function * (next) {
      this.status = 404;
      this.body = 'Original';
      yield next;
    })
  });

  it('works with a single noop Connect middleware', (done) => {
    app.use(c2k((req, res, next) => {
      next()
    }));
    supertest(app.callback())
      .get('/')
      .expect('Original')
      .end(done);
  });

  it('works with two noop Connect middleware', (done) => {
    app.use(c2k((req, res, next) => next()));
    app.use(c2k((req, res, next) => next()));
    supertest(app.callback())
      .get('/')
      .expect('Original')
      .end(done);
  });

  it('passes correctly to downstream Koa middlewares', (done) => {
    app.use(c2k((req, res, next) => next()));
    app.use(function * () { this.status = 200; });
    supertest(app.callback())
      .get('/')
      .expect(200)
      .end(done);
  });

  it('bubbles back to earlier middleware', (done) => {
    app.use(function * (next) {
      yield next;
      // Ensures that the following middleware is reached
      if ( this.status !== 200 ) {
        done(new Error('Never reached connect middleware'))
      }
      this.status = 201;
    });

    app.use(c2k((req, res) => res.statusCode = 200 ));

    supertest(app.callback())
      .get('/')
      .expect(201)
      .end(done);
  });

  it('receives errors from Connect middleware', (done) => {
    app.use(function * (next) {
      try {
        yield next;
      } catch (err) {
        this.status = 500;
      }
    })

    app.use(c2k((req, res, next) => {
      next(new Error('How Connect does error handling'));
    }));

    app.use(function * () {
      // Fail the test if this is reached
      done(new Error('Improper error handling'))
    })

    supertest(app.callback())
      .get('/')
      .expect(500)
      .end(done);
  });

  it('Setting the body or status in Koa middlewares does not do anything if res.end was used in a Connect middleware', (done) => {
    const message = 'The message that makes it';
    app.use(function * (next) {
      yield next;
      if ( this.status !== 200 ) {
        done(new Error('Never reached connect middleware'));
      }
      // These calls won't end up doing anything
      // And will cause Koa to log a "Can't set headers after they are sent" error
      this.status = 500;
      this.body = 'A story already written';
    });

    app.use(c2k((req, res) => {
      res.statusCode = 200;
      res.setHeader('Content-Length', message.length)
      res.end(message);
    }));

    supertest(app.callback())
      .get('/')
      .expect(200)
      .expect(message)
      .end(done);
  });
})
