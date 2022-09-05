module.exports = {
  evaluate: true,
  displayName: true,
  tagResolver: (source, tag) => {
    if (tag === 'styled') {
      return require.resolve('./lib/processors/styled.js');
    }
    return undefined;
  },
};
