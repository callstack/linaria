const loaderUtils = require('loader-utils');
const { cache } = require('./index');

module.exports = function loader() {
  this.cacheable(false);

  const query = loaderUtils.parseQuery(this.query);
  const { cssText } = cache[query.id];

  delete cache[query.id];

  return cssText;
};
