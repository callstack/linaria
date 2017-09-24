/* eslint-disable global-require */

module.exports = function linariaBabelPreset(context, opts = {}) {
  return {
    plugins: [
      [require('./build/babel/hoist-css').default, opts],
      [require('./build/babel/preval-extract').default, opts],
      [require('./build/babel/rewire-imports').default, opts],
    ],
  };
};
