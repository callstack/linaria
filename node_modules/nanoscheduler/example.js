var NanoScheduler = require('./')

var scheduler = NanoScheduler()
var i = 10000
while (i--) scheduler.push(() => console.log(`idle time! ${Date.now()}`))
