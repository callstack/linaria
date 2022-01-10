const Koa = require('koa')
const connect = require('connect')
const c2k = require('..')

const app = new Koa()
app.use(c2k(connect.logger('dev')))
app.use(c2k(connect.basicAuth('username', 'password')))

app.use((ctx) => {
  ctx.body = 'Hello'
})

app.listen(3000)
