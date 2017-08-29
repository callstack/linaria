/* eslint-disable global-require */

module.exports = function linariaBabelPreset(context, opts = {}) {
  return {
    plugins: [
      [require('./build/babel/preval-extract').default, opts],
      require('babel-plugin-preval'),
    ],
  };
};
