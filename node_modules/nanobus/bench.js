var bench = require('nanobench')
var nanobus = require('./')
var assert = require('assert')

bench('emit 200.000 times', function (b) {
  var bus = nanobus()
  var obj = { bin: 'baz' }
  bus.on('foo:bar', function (data) {
    assert.equal(data, obj, 'data was same')
  })
  bus.on('beep:boop', function (data) {
    assert.equal(data, undefined)
  })

  b.start()
  for (var i = 0; i < 200000; i++) {
    bus.emit('foo:bar', obj)
    bus.emit('beep:boop')
  }
  b.end()
})

bench('emit once 200.000 times', function (b) {
  var bus = nanobus()
  bus.once('foo:bar', function (data) {
    assert(true)
  })

  b.start()
  for (var i = 0; i < 200000; i++) {
    bus.emit('foo:bar')
    bus.emit('foo:bar')
  }
  b.end()
})

bench('run multiple * tests 200.000 times', function (b) {
  var bus = nanobus()
  var i = 0

  bus.on('foo:bar', handler)
  bus.on('bin:baz', handler)
  bus.on('*', handler)

  b.start()
  for (var j = 0; j < 200000; j++) {
    bus.emit('foo:bar')
    bus.emit('bin:baz')
    bus.removeAllListeners('bin:baz')
    bus.emit('bin:baz')
    bus.removeListener('*', handler)
    bus.emit('foo:bar')
    bus.on('*', handler)
    bus.emit('foo:bar')
    bus.removeAllListeners('*')
    bus.emit('foo:bar')
    bus.on('*', handler)
    bus.emit('foo:bar')
    bus.removeAllListeners()
    bus.once('*', handler)
    bus.emit('foo:bar')
    bus.emit('foo:bar')
    bus.removeAllListeners()
  }
  b.end()

  function handler (data) {
    assert(++i)
  }
})
