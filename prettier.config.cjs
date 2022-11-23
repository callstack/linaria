/** @type {import('prettier').Config} */
module.exports = {
  trailingComma: 'es5',
  singleQuote: true,
  plugins: [require.resolve('prettier-plugin-packagejson')],
};
