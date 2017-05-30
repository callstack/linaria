// Re-export babel plugin from build directory so you can require it like:
// require('linaria/babel')

// eslint-disable-next-line
module.exports = require('./build/babel').default;
