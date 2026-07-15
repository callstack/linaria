module.exports = {
  cache: false,
  testEnvironment: 'node',
  collectCoverageFrom: ['src/*.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!.*(@linaria|@wyw-in-js|oxc-parser|oxc-resolver|oxc-transform|@oxc-project))',
  ],
  transform: {
    '^.+\\.[tj]sx?$': ['babel-jest', { rootMode: 'upward' }],
  },
  testPathIgnorePatterns: ['/__utils__/'],
};
