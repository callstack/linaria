module.exports = function(context, options) {
  return {
    plugins: [[require('./extract'), options]],
  };
};
