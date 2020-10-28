module.exports = {
  testEnvironment: 'node',
  testRegex: '/__tests__/.*\\.(test|spec)\\.(js|tsx?)$',
  transform: {
    '^.+\\.(js|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!@linaria)'],
};
