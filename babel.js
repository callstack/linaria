/* eslint-disable global-require */

module.exports = function linariaBabelPreset(context, opts = {}) {
  const options = Object.assign(
    opts,
    // Escape hatch for overwriting linaria preset's options.
    JSON.parse(process.env.LINARIA_OVERWRITE_BABEL_PRESET || '{}')
  );

  return {
    plugins: [
      [require('./build/babel/preval-extract').default, opts],
      [require('./build/babel/rewire-imports').default, opts],
    ],
  };
};
