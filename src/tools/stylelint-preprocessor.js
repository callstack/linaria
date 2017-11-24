/* @flow */

import * as babel from 'babel-core';
import { SourceMapConsumer } from 'source-map';

import { getCachedModule } from '../babel/lib/moduleSystem';

type LintResults = {
  warnings: { line: number, column: number }[],
};

function toString(templates: string[], expressions: string[]) {
  return templates.reduce(
    (acc, template, i) =>
      `${acc}${template}${i >= expressions.length ? '' : expressions[i]}`,
    ''
  );
}

export default function linariaStylelintPreprocessor(/* options */) {
  process.env.LINARIA_BABEL_PRESET_OVERRIDES = JSON.stringify({
    extract: false,
  });
  // $FlowFixMe
  process.env.LINARIA_COLLECT_RAW_STYLES = true;

  const cache = {};

  return {
    code(input: string, filename: string) {
      const { code, map } = babel.transform(input, {
        filename,
        sourceMaps: true,
      });

      const rawStyles = getCachedModule(
        require.resolve('../sheet.js')
      ).exports.default.rawStyles();

      if (!Object.keys(rawStyles).length || !rawStyles[filename]) {
        return '';
      }

      const css = rawStyles[filename].reduce(
        (acc, { template, expressions, classname }) => {
          const styles = toString(
            template,
            expressions.map(expression => String(expression).replace('\n', ' '))
          );
          return `${acc}\n.${classname} {${styles}}`;
        },
        ''
      );

      cache[filename] = { css, code, map, input };

      return css;
    },
    result(lintResults: LintResults, filename: string) {
      if (!cache[filename]) {
        return;
      }

      const { code, css, map, input } = cache[filename];
      const { warnings } = lintResults;

      warnings.forEach(warning => {
        const relevantCss = css.split('\n').slice(1, warning.line);

        let classname;
        let offset = 0;
        for (let i = relevantCss.length - 1; i >= 0; i--) {
          const match = relevantCss[i].match(/\.(_?[a-zA-Z0-9]+__[a-z0-9]+) {/);
          if (match) {
            classname = match[1];
            offset = relevantCss.length - i - 1;
            break;
          }
        }

        const startLineLocation = code
          .split('\n')
          .findIndex(line => line.includes(classname));
        // prettier-ignore
        const startColumnLocation = code.split('\n')[startLineLocation]
          .indexOf(classname);

        const consumer = new SourceMapConsumer(map);
        const originalPos = consumer.originalPositionFor({
          line: startLineLocation + 1,
          column: startColumnLocation,
        });

        offset += input
          .split('\n')
          .slice(originalPos.line - 1)
          .findIndex(line => /css(\.named\(.+\))?`/.test(line));

        // eslint-disable-next-line no-param-reassign
        warning.line = originalPos.line + offset;
      });
    },
  };
}
