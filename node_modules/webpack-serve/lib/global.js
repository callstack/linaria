/* istanbul ignore file */
/* eslint-disable global-require, no-console, import/no-extraneous-dependencies */

module.exports = {
  register() {
    require('v8-compile-cache');
    require('loud-rejection/register');
  },
};
