const linaria = require('@linaria/babel-preset');
const babel = require('@babel/core');

const transformer = {
  process: (sourceText, sourcePath) => {
    const babelResult = babel.transform(sourceText, {
      // pick monorepo's babel.config.js with typescript and env presets
      // jsx should not be transpiled at this step
      // it will be transpiled later with babel-preset-solid
      filename: sourcePath,
    });
    if (!babelResult || !babelResult.code) {
      throw new Error('Cannot transpile source with babel');
    }
    const linariaResult = linaria.transformSync(
      babelResult.code,
      { filename: sourcePath },
      (what) => require.resolve(what)
    );
    const solidResult = babel.transform(linariaResult.code, {
      filename: sourcePath,
      // pick monorepo's babel.config.js with typescript and env presets
      presets: ['solid'],
    });
    return {
      code: `
        require('style-inject')(${JSON.stringify(linariaResult.cssText)});
        ${solidResult.code}
      `,
    };
  },
};

module.exports = transformer;
