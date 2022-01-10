const Koa = require('koa')
const c2k = require('..')

function middleware (req, res, next) {
  console.log('connect')
  next()
}

const app = new Koa()
app.use(c2k(middleware))

app.use((ctx) => {
  ctx.body = 'koa'
})

app.listen(3000)
