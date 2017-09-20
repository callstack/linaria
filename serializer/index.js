const CLASS_HTML_PATTERN = /class="([^"]+)"/;
const CLASS_HTML_REPLACE = /class="([^"]+)"/g;

module.exports = {
  serialize: (val, config, indentation, depth, refs, printer) => {
    const sheet = require('linaria/build/sheet').default;
    console.log(sheet.styles());
    // return printer(val);
    return val;
  },
  test: val =>
    (val &&
      (val.$$typeof === Symbol.for('react.element') ||
        val.$$typeof === Symbol.for('react.test.json'))) ||
    CLASS_HTML_PATTERN.test(val),
};
