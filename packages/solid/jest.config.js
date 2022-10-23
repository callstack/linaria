module.exports = {
  collectCoverageFrom: ['src/*.ts'],
  transformIgnorePatterns: ['node_modules/(?!@linaria)'],
  testEnvironment: 'jsdom',
  transform: {
    '\\.linaria.tsx': './__tests__/jest-transformer.js',
    '\\.[jt]sx?$': 'babel-jest',
  },
  testMatch: ['**/*.test.tsx'],
};
