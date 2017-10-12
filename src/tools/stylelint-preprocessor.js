import * as babel from 'babel-core';
import { addInterceptor } from '../babel/preval-extract';

export default function linariaStylelintPreprocessor(options) {
  return {
    code(input, filename) {
      const extractedStyles = [];
      process.on('linaria-extract', ({ styles }) => {
        extractedStyles.push(styles);
      });

      addInterceptor('pre-eval', ({ requirements }) => {
        requirements.forEach(requirement => {
          // eslint-disable-next-line no-param-reassign
          requirement.code = requirement.code.replace(
            /import {.*} from ["|'](linaria)["|']/,
            (substring, ...args) =>
              substring.replace(args[0], 'linaria/build/index.stylelint.js')
          );
        });
      });

      const { code, ast } = babel.transform(input, {
        filename,
        sourceMaps: true,
      });

      return extractedStyles.reduce(
        (acc, style, i) => `${acc}\n.test${i} {${style}}`,
        ''
      );
    },
    result(stylelintResult, filepath) {},
  };
}
