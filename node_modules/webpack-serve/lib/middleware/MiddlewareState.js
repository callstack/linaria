const defer = require('p-defer');
const mem = require('mem');

module.exports = class MiddlewareState {
  constructor() {
    this.called = false;
    this.deferred = defer();
    const og = this.call;
    this.call = mem((...args) => {
      this.called = true;
      return og.call(this, args);
    });
  }

  call() {
    this.called = true;
  }

  get state() {
    return this.deferred.promise;
  }
};
