const Koa = require('koa')
const connect = require('connect')
const c2k = require('..')

const app = new Koa()
app.use(c2k(connect.logger('dev')))
app.use(c2k(connect.directory(__dirname)))
app.use(c2k(connect.static(__dirname)))

app.use((ctx, next) => {
  ctx.body = 'koa'
  next()
})

app.listen(3000)
