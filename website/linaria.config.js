module.exports = {
  displayName: process.env.NODE_ENV !== 'production',
  // eslint-disable-next-line global-require
  atomize: require('@linaria/atomic').atomize,
};
