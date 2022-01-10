const Koa = require('koa')
const connect = require('connect')
const c2k = require('..')

const app = new Koa()
app.use(c2k(connect.logger('dev')))
app.use(c2k(connect.cookieParser()))
app.use(c2k(connect.cookieSession({ secret: 'keyboard cat'})))

app.use((ctx) => {
  const name = ctx.req.session.name = ctx.query.name || ctx.req.session.name
  ctx.body = name || 'Please, enter your name'
})

app.listen(3000)
