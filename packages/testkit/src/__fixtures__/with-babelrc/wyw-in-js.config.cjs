const path = require('path');

module.exports = {
  eval: {
    resolver: 'hybrid',
    customResolver(specifier) {
      if (!specifier.startsWith('_/')) {
        return Promise.resolve(null);
      }

      return Promise.resolve({
        id: require.resolve(path.resolve(__dirname, '..', specifier.slice(2))),
      });
    },
  },
};
