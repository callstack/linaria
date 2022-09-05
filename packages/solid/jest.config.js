module.exports = {
  collectCoverageFrom: ['src/*.ts'],
  transformIgnorePatterns: ['node_modules/(?!@linaria)'],
  testEnvironment: 'node',
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
  },
};
