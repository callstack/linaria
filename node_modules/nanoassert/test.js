var assert = require('.')
var test = require('tape')

test('test', function (t) {
  try {
    assert(true === true) // test that it doesn't throw
    t.pass('does not throw on truthy')
  } catch (e) {
    t.fail()
  }

  t.throws(assert.bind(null, false), 'throws on falsy')

  try {
    assert(false)
  } catch (e) {
    t.equal(e.message, 'AssertionError', 'default message')
  }

  try {
    assert(false, 'hello world')
  } catch (e) {
    t.equal(e.message, 'hello world', 'custom message')
  }

  t.end()
})
