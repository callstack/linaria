import stripAnsi from 'strip-ansi';

import { transform } from '@linaria/babel-preset';
import type { Replacements } from '@linaria/utils';
import { asyncResolveFallback } from '@linaria/utils';

type Errors = {
  [key: string]:
    | {
        name?: string;
        code?: string;
        message: string;
        pos?: number;
        loc?: {
          line: number;
          column: number;
        };
      }
    | null
    | undefined;
};

type Cache = {
  [key: string]: Replacements | null | undefined;
};

type Warning = {
  rule?: string;
  text: string;
  severity: 'error' | 'warning';
  line: number;
  column: number;
};

type LintResult = {
  errored: boolean;
  warnings: Warning[];
};

interface IPosition {
  line: number;
  column: number;
}

interface ISourceOffset {
  generated: IPosition;
  name: string;
  original: IPosition;
}

function preprocessor() {
  const errors: Errors = {};
  const cache: Cache = {};
  const offsets: Record<string, ISourceOffset[] | undefined> = {};

  return {
    async code(input: string, filename: string) {
      let result;

      try {
        result = await transform(
          input,
          {
            filename,
          },
          asyncResolveFallback
        );

        cache[filename] = undefined;
        errors[filename] = undefined;
        offsets[filename] = [];
      } catch (e: unknown) {
        cache[filename] = undefined;
        offsets[filename] = undefined;
        errors[filename] = e as Error;

        // Ignore parse errors here
        // We handle it separately
        return '';
      }

      const { rules, replacements } = result;

      if (!rules) {
        return '';
      }

      // Construct a CSS-ish file from the unprocessed style rules
      let generatedLineNumber = 1;
      const cssText = Object.values(rules)
        .map((rule) => {
          const ruleText = `.${rule.className} {${rule.cssText}}`;

          if (rule.start && 'line' in rule.start) {
            offsets[filename]?.push({
              generated: {
                line: generatedLineNumber,
                column: 1,
              },
              original: {
                ...rule.start,
              },
              name: rule.displayName,
            });

            generatedLineNumber += 1;
          }

          generatedLineNumber += ruleText.split('\n').length + 2;
          return ruleText;
        })
        .join('\n\n');

      cache[filename] = replacements;
      offsets[filename] = offsets[filename]?.reverse();

      return `${cssText}\n`;
    },
    result(result: LintResult, filename: string) {
      const error = errors[filename];
      const replacements = cache[filename];
      const sourceMap = offsets[filename];

      if (sourceMap) {
        // eslint-disable-next-line no-param-reassign
        result.warnings = result.warnings.map((warning) => {
          const offset = sourceMap.find(
            (o) => o.generated.line <= warning.line
          );
          if (offset) {
            // eslint-disable-next-line no-param-reassign
            warning.line += offset.original.line - offset.generated.line;
          }

          return warning;
        });
      }

      if (error) {
        // Babel adds this to the error message
        const prefix = `${filename}: `;

        let message = stripAnsi(
          error.message.startsWith(prefix)
            ? error.message.replace(prefix, '')
            : error.message
        );

        let { loc } = error;

        if (!loc) {
          // If the error doesn't have location info, try to find it from the code frame
          const line = message.split('\n').find((l) => l.startsWith('>'));
          const column = message.split('\n').find((l) => l.includes('^'));

          if (line && column) {
            loc = {
              line: Number(line.replace(/^> /, '').split('|')[0].trim()),
              column: column.replace(/[^|]+\|\s/, '').length,
            };
          }
        }

        if (loc) {
          // Strip the codeframe text if we have location of the error
          // It's formatted badly by stylelint, so not very helpful
          message = message.replace(/^>?\s+\d?\s\|.*$/gm, '').trim();
        }

        // eslint-disable-next-line no-param-reassign
        result.errored = true;
        result.warnings.push({
          rule: error.code || error.name,
          text: message,
          line: loc ? loc.line : 0,
          column: loc ? loc.column : 0,
          severity: 'error',
        });
      }

      if (replacements) {
        replacements.forEach(({ original, length }) => {
          // If the warnings contain stuff that's been replaced,
          // Correct the line and column numbers to what's replaced
          result.warnings.forEach((w) => {
            /* eslint-disable no-param-reassign */
            if (w.line === original.start.line) {
              // If the error is on the same line where an interpolation started, we need to adjust the line and column numbers
              // Because a replacement would have increased or decreased the column numbers
              // If it's in the same line where interpolation ended, it would have been adjusted during replacement
              if (w.column > original.start.column + length) {
                // The error is from an item after the replacements
                // So we need to adjust the column
                w.column +=
                  original.end.column - original.start.column + 1 - length;
              } else if (
                w.column >= original.start.column &&
                w.column < original.start.column + length
              ) {
                // The linter will underline the whole word in the editor if column is in inside a word
                // Set the column to the end, so it will underline the word inside the interpolation
                // e.g. in `${colors.primary}`, `primary` will be underlined
                w.column =
                  original.start.line === original.end.line
                    ? original.end.column - 1
                    : original.start.column;
              }
            }
          });
        });
      }

      return result;
    },
  };
}

export default preprocessor;
