module.exports = filename => {
  const input = require(filename);
  if (input.__esModule) {
    const output = input.default;
    Object.keys(input).filter(key => key !== 'default').forEach(key => {
      output[key] = input[key];
    });
    return output;
  }
  return input;
};
