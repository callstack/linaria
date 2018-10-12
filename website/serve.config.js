const path = require('path');

module.exports = {
  port: 3242,
  content: path.resolve(__dirname),
  devMiddleware: {
    publicPath: '/dist/',
  },
};
