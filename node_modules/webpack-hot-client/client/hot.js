"use strict";

var log = require('./log');

var refresh = 'Please refresh the page.';
var hotOptions = {
  ignoreUnaccepted: true,
  ignoreDeclined: true,
  ignoreErrored: true,
  onUnaccepted: function onUnaccepted(data) {
    var chain = [].concat(data.chain);
    var last = chain[chain.length - 1];

    if (last === 0) {
      chain.pop();
    }

    log.warn("Ignored an update to unaccepted module ".concat(chain.join(' ➭ ')));
  },
  onDeclined: function onDeclined(data) {
    log.warn("Ignored an update to declined module ".concat(data.chain.join(' ➭ ')));
  },
  onErrored: function onErrored(data) {
    log.warn("Ignored an error while updating module ".concat(data.moduleId, " <").concat(data.type, ">"));
    log.warn(data.error);
  }
};
var lastHash;

function upToDate() {
  return lastHash.indexOf(__webpack_hash__) >= 0;
}

function result(modules, appliedModules) {
  var unaccepted = modules.filter(function (moduleId) {
    return appliedModules && appliedModules.indexOf(moduleId) < 0;
  });

  if (unaccepted.length > 0) {
    var message = 'The following modules could not be updated:';
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = unaccepted[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var moduleId = _step.value;
        message += "\n          \u29BB ".concat(moduleId);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    log.warn(message);
  }

  if (!(appliedModules || []).length) {
    log.info('No Modules Updated.');
  } else {
    var _message = ['The following modules were updated:'];
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = appliedModules[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var _moduleId = _step2.value;

        _message.push("         \u21BB ".concat(_moduleId));
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    log.info(_message.join('\n'));
    var numberIds = appliedModules.every(function (moduleId) {
      return typeof moduleId === 'number';
    });

    if (numberIds) {
      log.info('Please consider using the NamedModulesPlugin for module names.');
    }
  }
}

function check(options) {
  module.hot.check().then(function (modules) {
    if (!modules) {
      log.warn("Cannot find update. The server may have been restarted. ".concat(refresh));

      if (options.reload) {
        window.location.reload();
      }

      return null;
    }

    var hotOpts = options.reload ? {} : hotOptions;
    return module.hot.apply(hotOpts).then(function (appliedModules) {
      if (!upToDate()) {
        check(options);
      }

      result(modules, appliedModules);

      if (upToDate()) {
        log.info('App is up to date.');
      }
    }).catch(function (err) {
      var status = module.hot.status();

      if (['abort', 'fail'].indexOf(status) >= 0) {
        log.warn("Cannot apply update. ".concat(refresh));
        log.warn(err.stack || err.message);

        if (options.reload) {
          window.location.reload();
        }
      } else {
        log.warn("Update failed: ".concat(err.stack) || err.message);
      }
    });
  }).catch(function (err) {
    var status = module.hot.status();

    if (['abort', 'fail'].indexOf(status) >= 0) {
      log.warn("Cannot check for update. ".concat(refresh));
      log.warn(err.stack || err.message);

      if (options.reload) {
        window.location.reload();
      }
    } else {
      log.warn("Update check failed: ".concat(err.stack) || err.message);
    }
  });
}

if (module.hot) {
  log.info('Hot Module Replacement Enabled. Waiting for signal.');
} else {
  log.error('Hot Module Replacement is disabled.');
}

module.exports = function update(currentHash, options) {
  lastHash = currentHash;

  if (!upToDate()) {
    var status = module.hot.status();

    if (status === 'idle') {
      log.info('Checking for updates to the bundle.');
      check(options);
    } else if (['abort', 'fail'].indexOf(status) >= 0) {
      log.warn("Cannot apply update. A previous update ".concat(status, "ed. ").concat(refresh));

      if (options.reload) {
        window.location.reload();
      }
    }
  }
};