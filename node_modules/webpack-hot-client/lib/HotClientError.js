module.exports = class HotClientError extends Error {
  constructor(message) {
    super(`webpack-hot-client: ${message}`);
  }
};
