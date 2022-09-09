module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: ['src/*.ts'],
  transformIgnorePatterns: ['node_modules/(?!@linaria)'],
  testPathIgnorePatterns: ['/__utils__/'],
};
