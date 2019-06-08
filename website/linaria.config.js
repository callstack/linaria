const isDev = process.env.NODE_ENV !== 'production';

module.exports = {
  displayName: isDev,
};
