/* eslint-disable global-require */

module.exports = function linariaBabelPreset(context, opts = {}) {
  return {
    plugins: [
      [require('./build/babel').default, opts],
      require('babel-plugin-preval'),
    ],
  };
};
