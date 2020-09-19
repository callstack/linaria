'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _ajv = require('ajv');

var _ajv2 = _interopRequireDefault(_ajv);

var _ajvKeywords = require('ajv-keywords');

var _ajvKeywords2 = _interopRequireDefault(_ajvKeywords);

var _webpackLog = require('webpack-log');

var _webpackLog2 = _interopRequireDefault(_webpackLog);

var _options = require('../schema/options.json');

var _options2 = _interopRequireDefault(_options);

var _ValidationError = require('./ValidationError');

var _ValidationError2 = _interopRequireDefault(_ValidationError);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ajv = new _ajv2.default({
  allErrors: true,
  useDefaults: true,
  errorDataPath: 'property'
});
var defaults = {
  exit: false,
  log: false,
  name: '',
  schema: '',
  target: {},
  throw: true
};
var logName = 'schema-utils';

(0, _ajvKeywords2.default)(ajv, ['instanceof', 'typeof']);

var validate = function validate(options) {
  var schema = void 0;

  if (typeof options.schema === 'string') {
    schema = _fs2.default.readFileSync(_path2.default.resolve(options.schema), 'utf8');
    schema = JSON.parse(schema);
  } else {
    schema = Object.assign({}, options.schema);
  }

  if (!ajv.validate(schema, options.target)) {
    var errors = ajv.errors;


    errors = errors.sort(function (a, b) {
      var aPath = a.dataPath;
      var bPath = b.dataPath;

      if (aPath.startsWith('[')) {
        if (!bPath.startsWith('[')) {
          return -1;
        }

        return aPath < bPath ? -1 : 1;
      }

      if (aPath.startsWith('.') && bPath.startsWith('.')) {
        return aPath < bPath ? -1 : 1;
      }

      return 0;
    });

    var err = new _ValidationError2.default(Object.assign(options, { errors }));

    if (options.throw) {
      throw err;
    }

    if (options.log) {
      var log = (0, _webpackLog2.default)({
        name: options.name || logName,
        id: `${logName}-validator`
      });
      log.error(`${err.meta.desc}\n\n${err.format()}\n`);
    }

    if (options.exit) {
      process.exit(1);
    }
  }

  return true;
};

var validator = function validator(opts) {
  validate({
    throw: true,
    schema: _options2.default,
    target: opts
  });

  var options = Object.assign({}, defaults, opts);

  return validate(options);
};

exports.default = validator;