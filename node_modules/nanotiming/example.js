var nanotiming = require('./')

try {
  var hooks = require('perf_hooks')
  var nanot = nanotiming('my-loop') // Start profiling
} catch (e) {
  console.log('perf_hooks not available, exiting')
  process.exit(1)
}
var performance = hooks.performance

var i = 10
while (--i) console.log(i)

// Stop profiling
nanot()

var timings = performance.getEntries()
var timing = timings[timings.length - 1]
console.log(timing.name, timing.duration) // log the last entry
performance.clearMeasures(timing.name)    // be a good citizen and free after use
