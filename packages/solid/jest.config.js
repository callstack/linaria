module.exports = {
  collectCoverageFrom: ['src/*.ts'],
  transformIgnorePatterns: ['node_modules/(?!@linaria)'],
  testEnvironment: 'jsdom',
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
  },
};
