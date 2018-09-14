module.exports = function linaria(context, options) {
  return {
    plugins: [[require('./extract'), options]],
  };
};
