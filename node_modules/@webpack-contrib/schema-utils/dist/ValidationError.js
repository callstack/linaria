'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _stripAnsi = require('strip-ansi');

var _stripAnsi2 = _interopRequireDefault(_stripAnsi);

var _textTable = require('text-table');

var _textTable2 = _interopRequireDefault(_textTable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ValidationError = function (_Error) {
  _inherits(ValidationError, _Error);

  function ValidationError(options) {
    _classCallCheck(this, ValidationError);

    // Workaround for https://github.com/istanbuljs/istanbuljs/issues/139
    var _this = _possibleConstructorReturn(this, (ValidationError.__proto__ || Object.getPrototypeOf(ValidationError)).call(this));

    _this.constructor = ValidationError;
    _this.__proto__ = ValidationError.prototype;
    // End Workaround
    // prettier-ignore
    _this.message = _chalk2.default`${options.name}`;
    _this.meta = options;
    _this.meta.desc = _chalk2.default`{underline Options Validation Error}`;
    _this.name = 'ValidationError';

    if (options.log) {
      _this.message += `: ${_this.meta.desc}`;
    } else {
      _this.message += `\n\n  ${_this.meta.desc}\n\n${_this.format()}\n`;
    }

    Error.captureStackTrace(_this, _this.constructor);
    return _this;
  }

  _createClass(ValidationError, [{
    key: 'format',
    value: function format() {
      var errors = this.meta.errors;

      var rows = [];
      var options = {
        align: ['', 'l', 'l'],
        stringLength(str) {
          return (0, _stripAnsi2.default)(str).length;
        }
      };

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = errors[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var err = _step.value;

          rows.push(['', _chalk2.default`{dim options}${err.dataPath}`, _chalk2.default`{blue ${err.message}}`]);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return (0, _textTable2.default)(rows, options);
    }

    // eslint-disable-next-line class-methods-use-this

  }, {
    key: 'toString',
    value: function toString() {
      return `${this.message}\n\n${this.format()}`;
    }
  }]);

  return ValidationError;
}(Error);

exports.default = ValidationError;