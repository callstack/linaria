var tape = require('tape')
var nanobus = require('./')

tape('nanobus', function (t) {
  t.test('should assert input types', function (t) {
    t.plan(11)
    var bus = nanobus()
    t.throws(bus.emit.bind(bus), /string/)
    t.throws(bus.on.bind(bus), /string/)
    t.throws(bus.on.bind(bus, 'foo'), /function/)
    t.throws(bus.once.bind(bus), /string/)
    t.throws(bus.once.bind(bus, 'foo'), /function/)
    t.throws(bus.removeListener.bind(bus), /string/)
    t.throws(bus.removeListener.bind(bus, 'foo'), /function/)

    var s = Symbol('event')
    var fn = function () {}
    t.doesNotThrow(bus.emit.bind(bus, s))
    t.doesNotThrow(bus.on.bind(bus, s, fn))
    t.doesNotThrow(bus.once.bind(bus, s, fn))
    t.doesNotThrow(bus.removeListener.bind(bus, s, fn))
  })

  t.test('should emit messages', function (t) {
    t.plan(4)
    var bus = nanobus()
    var obj = { bin: 'baz' }
    bus.on('foo:bar', function (data) {
      t.equal(data, obj, 'data was same')
    })

    bus.emit('foo:bar', obj)

    bus.on('beep:boop', function (data) {
      t.equal(data, undefined)
    })

    bus.emit('beep:boop')

    bus.on('baz:floop', function (arg1, arg2) {
      t.equal(arg1, 'arg1', 'data was same')
      t.equal(arg2, 'arg2', 'data was same')
    })

    bus.emit('baz:floop', 'arg1', 'arg2')
  })

  t.test('should prepend listeners', function (t) {
    t.plan(4)
    var i = 0
    var bus = nanobus()
    bus.on('foo:bar', function (data) {
      t.equal(i, 1)
    })

    bus.prependListener('foo:bar', function (data) {
      t.equal(i, 0)
      i++
    })

    bus.emit('foo:bar')

    bus.on('*', function (data) {
      t.equal(i, 1)
    })

    bus.prependListener('*', function (eventName, data) {
      t.equal(i, data)
      i++
    })

    i = 0
    bus.emit('bar:baz', i)
  })

  t.test('should prepend once listeners', function (t) {
    t.plan(3)
    var i = 0
    var bus = nanobus()
    bus.on('foo:bar', function (data) {
      t.equal(i, 1)
    })

    bus.prependOnceListener('foo:bar', function (data) {
      t.equal(i, 0)
      i++
    })

    bus.emit('foo:bar')
    bus.emit('foo:bar')
  })

  t.test('should emit messages once', function (t) {
    t.plan(1)
    var bus = nanobus()
    bus.once('foo:bar', function (data) {
      t.pass('called')
    })

    bus.emit('foo:bar')
    bus.emit('foo:bar')
  })

  t.test('should properly emit messages when using both once() and on() ', function (t) {
    t.plan(2)
    var bus = nanobus()
    var i = 0

    bus.once('foo:bar', function onceIncrement () {
      i++
    })

    bus.on('foo:bar', function onIncrement () {
      i++
    })

    bus.once('*', function wildcardOnceIncrement () {
      i++
    })

    bus.on('*', function wildcardOnIncrement () {
      i++
    })

    bus.emit('foo:bar')
    t.equal(i, 4, 'incremented by once() and on()')

    bus.emit('foo:bar')
    t.equal(i, 6, 'incremented by on() only')
  })

  t.test('should trigger wildcard once', function (t) {
    t.plan(3)
    var bus = nanobus()
    bus.once('*', function (data) {
      t.pass('called')
    })

    bus.on('foo:bar', function (data) {
      t.pass('called foo:bar')
    })

    bus.on('foo:baz', function (data) {
      t.pass('called foo:baz')
    })

    bus.emit('foo:bar')
    bus.emit('foo:baz')
  })

  t.test('should be able to remove listeners', function (t) {
    t.plan(3)
    var bus = nanobus()
    bus.on('foo:bar', goodHandler)
    bus.on('foo:bar', badHandler)
    bus.removeListener('foo:bar', badHandler)
    bus.emit('foo:bar')

    bus.once('foo:bar', goodHandler)
    bus.removeListener('foo:bar', onceHandler)
    bus.emit('foo:bar')

    function goodHandler (data) {
      t.pass('called')
    }

    function onceHandler (data) {
      t.pass('called')
    }

    function badHandler (data) {
      t.fail('oh no!')
    }
  })

  t.test('should be able to remove all listeners', function (t) {
    t.plan(1)
    var bus = nanobus()
    var i = 0

    bus.on('foo:bar', handler)
    bus.on('bin:baz', handler)
    bus.removeAllListeners()
    bus.emit('foo:bar')
    bus.emit('bin:baz')

    t.equal(i, 0, 'no events called')

    function handler (data) {
      i++
    }
  })

  t.test('should be able to remove all listeners for an event', function (t) {
    t.plan(1)
    var bus = nanobus()
    var i = 0

    bus.on('foo:bar', handler)
    bus.on('bin:baz', handler)
    bus.removeAllListeners('bin:baz')
    bus.emit('foo:bar')
    bus.emit('bin:baz')

    t.equal(i, 1, '1 event called')

    function handler (data) {
      i++
    }
  })

  t.test('should be able to have * listeners', function (t) {
    t.plan(12)
    var bus = nanobus()
    var i = 0

    bus.on('foo:bar', handler)
    bus.on('bin:baz', handler)
    bus.on('*', handler)

    bus.emit('foo:bar')
    t.equal(i, 2, 'count 2')

    bus.emit('bin:baz')
    t.equal(i, 4, 'count 4')

    bus.removeAllListeners('bin:baz')
    bus.emit('bin:baz')
    t.equal(i, 5, 'count 5')

    bus.removeListener('*', handler)
    bus.emit('foo:bar')
    t.equal(i, 6, 'count 6')

    bus.on('*', handler)
    bus.emit('foo:bar')
    t.equal(i, 8, 'count 8')

    bus.removeAllListeners('*')
    bus.emit('foo:bar')
    t.equal(i, 9, 'count 9')

    bus.on('*', handler)
    bus.emit('foo:bar')
    t.equal(i, 11, 'count 11')

    bus.removeAllListeners()
    t.equal(i, 11, 'count 11')

    bus.once('*', handler)
    bus.emit('foo:bar')
    t.equal(i, 12, 'count 12')
    bus.emit('foo:bar')
    t.equal(i, 12, 'count 12')

    bus.removeAllListeners()
    t.equal(i, 12, 'count 12')

    bus.on('*', starHandler)
    bus.emit('star:event', i)
    bus.removeAllListeners()

    function handler (data) {
      i++
    }

    function starHandler (eventName, data) {
      t.equal(data, i, 'data was same')
    }
  })

  t.test('should be able to remove listeners that have not been attached', function (t) {
    var bus = nanobus()

    t.doesNotThrow(function () {
      bus.removeListener('yay', handler)
    }, 'removes unattched "yay" event')
    t.doesNotThrow(function () {
      bus.removeListener('*', handler)
    }, 'removes unattached "*" event')
    t.end()

    function handler () {}
  })

  t.test('should be able to get an array of listeners', function (t) {
    t.plan(2)
    var bus = nanobus()

    bus.on('foo', bar)
    bus.on('foo', baz)

    t.deepEqual(bus.listeners('foo'), [bar, baz])

    bus.on('*', bar)
    bus.on('*', baz)

    t.deepEqual(bus.listeners('foo'), [bar, baz])

    function bar (data) {}
    function baz (data) {}
  })

  t.test('should be able to trigger multiple listeners with same args', function (t) {
    t.plan(6)
    var obj = {foo: 'bar'}
    var bus = nanobus()

    bus.on('foo', function (data) {
      t.deepEqual(data, obj)
    })

    bus.on('foo', function (data) {
      t.deepEqual(data, obj)
    })

    bus.on('foo', function (data) {
      t.deepEqual(data, obj)
    })

    bus.on('*', function (name, data) {
      t.deepEqual(data, obj)
    })

    bus.on('*', function (name, data) {
      t.deepEqual(data, obj)
    })

    bus.on('*', function (name, data) {
      t.deepEqual(data, obj)
    })

    bus.emit('foo', obj)
  })
})
