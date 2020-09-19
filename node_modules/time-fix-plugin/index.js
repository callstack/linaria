module.exports = class TimeFixPlugin {
  constructor(watchOffset = 11000) {
    this.watchOffset = watchOffset
  }

  apply(compiler) {
    const context = this
    const watch = compiler.watch
    let watching
    let fixed

    // Modify the time for first run
    compiler.watch = function () {
      watching = watch.apply(this, arguments)
      watching.startTime += context.watchOffset
      return watching
    }

    // Modify the time for subsequent runs
    compiler.hooks.watchRun.tap('time-fix-plugin', () => {
      if (watching && !fixed) {
        watching.startTime += this.watchOffset
      }
    })

    // Reset time
    compiler.hooks.done.tap('time-fix-plugin', stats => {
      if (watching && !fixed) {
        stats.startTime -= this.watchOffset
        fixed = true
      }
    })
  }
}
