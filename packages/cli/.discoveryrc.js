module.exports = {
  name: 'Node modules structure',
  data() {
    return require('./src/discovery/collect-data');
  },
  view: {
    assets: [
      './src/discovery/pages/default.js',
      './src/discovery/pages/entrypoint.js',
    ],
  },
};
