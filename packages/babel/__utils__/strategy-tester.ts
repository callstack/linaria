/* eslint-env jest */
/* eslint-disable import/no-extraneous-dependencies */
import { join, resolve } from 'path';
import * as babel from '@babel/core';
import dedent from 'dedent';
import stripAnsi from 'strip-ansi';

import { Module } from '../src';
import type { Evaluator, StrictOptions } from '../src';
import serializer from './linaria-snapshot-serializer';

expect.addSnapshotSerializer(serializer);
async function transformAsync(
  code: string,
  opts?: babel.TransformOptions
): Promise<babel.BabelFileResult> {
  return (await babel.transformAsync(code, opts))!;
}

async function transformFileAsync(
  filename: string,
  opts?: babel.TransformOptions
): Promise<babel.BabelFileResult> {
  return (await babel.transformFileAsync(filename, opts))!;
}

type TranspileFn = (
  input: string,
  conf?: (original: babel.TransformOptions) => babel.TransformOptions
) => Promise<babel.BabelFileResult>;

export function run(
  dirname: string,
  evaluator: Evaluator,
  strategyDependentTests: (transpile: TranspileFn) => void = () => {}
): void {
  const babelrc: babel.TransformOptions = {
    babelrc: false,
    configFile: false,
    plugins: [],
    presets: [
      [
        require.resolve('../src'),
        {
          displayName: true,
          evaluate: true,
          rules: [
            {
              action: evaluator,
            },
            {
              test: /\/node_modules\/(?!@linaria)/,
              action: 'ignore',
            },
            {
              test: /\/@linaria\/(?:core|react)\/\w+\.ts/,
              action: (
                filename: string,
                options: StrictOptions,
                text: string
              ) => {
                const { code } = babel.transformSync(text, {
                  filename,
                })!;
                return [code, new Map<string, string[]>()];
              },
            },
          ],
        },
      ],
    ],
  };

  const transpile: TranspileFn = async (
    input: string,
    conf: (original: typeof babelrc) => typeof babelrc = (i) => i
  ) => {
    const { code, metadata } = await transformAsync(input, {
      filename: join(dirname, 'source.js'),
      ...conf(babelrc),
    });
    // The slug will be machine specific, so replace it with a consistent one
    return {
      metadata,
      code,
    };
  };

  beforeEach(() => Module.invalidateEvalCache());

  it('evaluates identifier in scope', async () => {
    const { code, metadata } = await transpile(
      dedent`
      import { styled } from '@linaria/react';

      const answer = 42;
      const foo = () => answer;
      const days = foo() + ' days';

      export const Title = styled.h1\`
        &:before {
          content: "${'${days}'}"
        }
      \`;
      `
    );
    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('hoistable identifiers', async () => {
    const { code, metadata } = await transpile(
      dedent`
      import { styled } from '@linaria/react';

      {
        var days = 42;
      }

      export const Title = styled.h1\`
        &:before {
          content: "${'${days}'}"
        }
      \`;
      `
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('non-hoistable identifiers', async () => {
    expect.assertions(1);

    try {
      await transpile(
        dedent`
        import { styled } from '@linaria/react';

        {
          const days = 42;
        }

        export const Title = styled.h1\`
          &:before {
            content: "${'${days}'}"
          }
        \`;
        `
      );
    } catch (e) {
      expect(
        stripAnsi(
          (e as { message: string }).message.replace(dirname, '<<DIRNAME>>')
        )
      ).toMatchSnapshot();
    }
  });

  it('evaluates babel helpers', async () => {
    const { code, metadata } = await transpile(
      dedent`
      import { styled } from '@linaria/react';

      function copyAndExtend(a, b) {
        return { ...a, ...b };
      }

      const obj = copyAndExtend({ a: 1 }, { a: 2 });

      export const Title = styled.h1\`
        &:before {
          content: "${'${obj.a}'}"
        }
      \`;
      `
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates imported typescript enums', async () => {
    const { code, metadata } = await transpile(
      dedent`
      import { styled } from '@linaria/react';
      import { Colors } from '@linaria/babel-preset/__fixtures__/enums';

      export const Title = styled.h1\`
        color: ${'${Colors.BLUE}'};
      \`;
      `,
      (config) => ({
        ...config,
        presets: ['@babel/preset-typescript', ...(config.presets ?? [])],
        filename: 'source.ts',
      })
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates local expressions', async () => {
    const { code, metadata } = await transpile(
      dedent`
      import { styled } from '@linaria/react';

      const answer = 42;
      const foo = () => answer;

      export const Title = styled.h1\`
        &:before {
          content: "${"${foo() + ' days'}"}"
        }
      \`;
      `
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates functions with nested identifiers', async () => {
    const { code, metadata } = await transpile(
      dedent`
      import { styled } from '@linaria/react';

      const objects = { key: { fontSize: 12 } };
      const foo = (k) => {
        const obj = objects[k];
        return obj;
      };

      export const Title = styled.h1\`
        ${"${foo('key')}"}
      \`;
      `
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates expressions with dependencies', async () => {
    const { code, metadata } = await transpile(
      dedent`
      import { styled } from '@linaria/react';
      import slugify from '@linaria/babel-preset/__fixtures__/slugify';

      export const Title = styled.h1\`
        &:before {
          content: "${"${slugify('test')}"}"
        }
      \`;
      `
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates expressions with expressions depending on shared dependency', async () => {
    const { code, metadata } = await transpile(
      dedent`
      import { styled } from '@linaria/react';
      const slugify = require('@linaria/babel-preset/__fixtures__/slugify').default;

      const boo = t => slugify(t) + 'boo';
      const bar = t => slugify(t) + 'bar';

      export const Title = styled.h1\`
        &:before {
          content: "${"${boo('test') + bar('test')}"}"
        }
      \`;
      `
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates multiple expressions with shared dependency', async () => {
    const { code, metadata } = await transpile(
      dedent`
      import { styled } from '@linaria/react';
      const slugify = require('@linaria/babel-preset/__fixtures__/slugify').default;

      const boo = t => slugify(t) + 'boo';
      const bar = t => slugify(t) + 'bar';

      export const Title = styled.h1\`
        &:before {
          content: "${"${boo('test')}"}"
          content: "${"${bar('test')}"}"
        }
      \`;
      `
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates interpolations with sequence expression', async () => {
    const { code, metadata } = await transpile(
      dedent`
      import { styled } from '@linaria/react';
      let external = 0;
      export const Title = styled.h1\`
        color: ${'${(external, () => "blue")}'};
      \`;
      `
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates dependencies with sequence expression', async () => {
    const { code, metadata } = await transpile(
      dedent`
      import { styled } from '@linaria/react';
      let external = 0;
      const color = (external, () => 'blue');

      export const Title = styled.h1\`
        color: ${'${color}'};
      \`;
      `
    );
    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates component interpolations', async () => {
    const { code, metadata } = await transpile(
      dedent`
      const { styled } = require('@linaria/react');

      export const Title = styled.h1\`
        color: red;
      \`;

      export const Paragraph = styled.p\`
        ${'${Title}'} {
          color: blue;
        }
      \`;
      `
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('throws when interpolation evaluates to undefined', async () => {
    expect.assertions(1);

    try {
      await transpile(
        dedent`
        const { styled } = require('@linaria/react');

        let fontSize;

        export const Title = styled.h1\`
          font-size: ${'${fontSize}'};
        \`;
        `
      );
    } catch (e) {
      expect(
        stripAnsi(
          (e as { message: string }).message.replace(dirname, '<<DIRNAME>>')
        )
      ).toMatchSnapshot();
    }
  });

  it('throws when interpolation evaluates to null', async () => {
    expect.assertions(1);

    try {
      await transpile(
        dedent`
        const { styled } = require('@linaria/react');

        const color = null;

        export const Title = styled.h1\`
          color: ${'${color}'};
        \`;
        `
      );
    } catch (e) {
      expect(
        stripAnsi(
          (e as { message: string }).message.replace(dirname, '<<DIRNAME>>')
        )
      ).toMatchSnapshot();
    }
  });

  it('throws when interpolation evaluates to NaN', async () => {
    expect.assertions(1);

    try {
      await transpile(
        dedent`
        const { styled } = require('@linaria/react');

        const height = NaN;

        export const Title = styled.h1\`
          height: ${'${height}'}px;
        \`;
        `
      );
    } catch (e) {
      expect(
        stripAnsi(
          (e as { message: string }).message.replace(dirname, '<<DIRNAME>>')
        )
      ).toMatchSnapshot();
    }
  });

  it('handles wrapping another styled component', async () => {
    const { code, metadata } = await transpile(
      dedent`
      const { css } = require('..');
      const { styled } = require('@linaria/react');

      const Title = styled.h1\`
        color: red;
      \`;

      export const BlueTitle = styled(Title)\`
        font-size: 24px;
        color: blue;
      \`;

      export const GreenTitle = styled(BlueTitle)\`
        color: green;
      \`;
      `
    );
    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('handles indirect wrapping another styled component', async () => {
    const { code, metadata } = await transpile(
      dedent`
      const { styled } = require('@linaria/react');

      const Title = styled.h1\`
        color: red;
      \`;

      const hoc = Cmp => Cmp;

      export const CustomTitle = styled(hoc(Title))\`
        font-size: 24px;
        color: blue;
      \`;
      `
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('inlines object styles as CSS string', async () => {
    const { code, metadata } = await transpile(
      dedent`
      import { styled } from '@linaria/react';

      const fill = (top = 0, left = 0, right = 0, bottom = 0) => ({
        position: 'absolute',
        top,
        right,
        bottom,
        left,
      });

      export const Title = styled.h1\`
        ${'${fill(0, 0)}'}
      \`;
      `
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('inlines array styles as CSS string', async () => {
    const { code, metadata } = await transpile(
      dedent`
      import { styled } from '@linaria/react';

      const fill = (top = 0, left = 0, right = 0, bottom = 0) => [
        { position: 'absolute' },
        {
          top,
          right,
          bottom,
          left,
        }
      ];

      export const Title = styled.h1\`
        ${'${fill(0, 0)}'}
      \`;
      `
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('ignores inline arrow function expressions', async () => {
    const { code, metadata } = await transpile(
      dedent`
      import { styled } from '@linaria/react';

      export const Title = styled.h1\`
        &:before {
          content: "${'${props => props.content}'}"
        }
      \`;
      `
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('simplifies react components', async () => {
    const div = '<div>{props.children + constant}</div>';
    const { code, metadata } = await transpile(
      dedent`
      import React from 'react';
      import { styled } from '@linaria/react';
      import constant from './broken-dependency';

      const FuncComponent = (props) => ${div};

      class ClassComponent extends React.PureComponent {
        method() {
            return constant;
        }

        render() {
            return ${div};
        }
      }

      export const StyledFunc = styled(FuncComponent)\`
        color: red;
      \`;
      export const StyledClass = styled(ClassComponent)\`
        color: blue;
      \`;
      `,
      (config) => ({
        ...config,
        plugins: ['@babel/plugin-syntax-jsx', ...(config.plugins || [])],
      })
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('ignores inline vanilla function expressions', async () => {
    const { code, metadata } = await transpile(
      dedent`
      import { styled } from '@linaria/react';

      export const Title = styled.h1\`
        &:before {
          content: "${'${function(props) { return props.content }}'}"
        }
      \`;
      `
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('ignores external expressions', async () => {
    const { code, metadata } = await transpile(
      dedent`
      import { styled } from '@linaria/react';

      const generate = props => props.content;

      export const Title = styled.h1\`
        &:before {
          content: "${'${generate}'}"
        }
      \`;
      `
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates complex styles with functions and nested selectors', async () => {
    const { code, metadata } = await transpile(
      dedent`
      import { css } from '@linaria/core';
      export const bareIconClass = css\`\`;

      const getSizeStyles = (fs) => ({
        [\`${'&.${bareIconClass}'}\`]: {
          fontSize: fs * 1.5,
        },
      });

      export const SIZES = {
        XS: css\`${'${getSizeStyles(11)}'}\`,
      };
      `
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('throws codeframe error when evaluation fails', async () => {
    expect.assertions(1);

    try {
      await transpile(
        dedent`
        import { styled } from '@linaria/react';

        const foo = props => { throw new Error('This will fail') };

        export const Title = styled.h1\`
          font-size: ${'${foo()}'}px;
        \`;
        `
      );
    } catch (e) {
      expect(
        stripAnsi(
          (e as { message: string }).message.replace(dirname, '<<DIRNAME>>')
        )
      ).toMatchSnapshot();
    }
  });

  it('handles escapes properly', async () => {
    const { code, metadata } = await transformFileAsync(
      resolve(__dirname, '../__fixtures__/escape-character.js'),
      babelrc
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('handles complex component', async () => {
    const { code, metadata } = await transformFileAsync(
      resolve(__dirname, '../__fixtures__/complex-component.js'),
      babelrc
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('generates stable class names', async () => {
    const { code, metadata } = await transformFileAsync(
      resolve(__dirname, '../__fixtures__/components-library.js'),
      babelrc
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('derives display name from filename', async () => {
    const { code, metadata } = await transformAsync(
      dedent`
      import { styled } from '@linaria/react';

      export default styled.h1\`
        font-size: 14px;
      \`;
      `,
      {
        ...babelrc,
        filename: join(dirname, 'FancyName.js'),
      }
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('derives display name from parent folder name', async () => {
    const { code, metadata } = await transformAsync(
      dedent`
      import { styled } from '@linaria/react';

      export default styled.h1\`
        font-size: 14px;
      \`;
      `,
      {
        ...babelrc,
        filename: join(dirname, 'FancyName/index.js'),
      }
    )!;

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it("throws if couldn't determine a display name", async () => {
    expect.assertions(1);

    try {
      await transformAsync(
        dedent`
        import { styled } from '@linaria/react';

        export default styled.h1\`
          font-size: 14px;
        \`;
        `,
        {
          ...babelrc,
          filename: join(dirname, '/.js'),
        }
      );
    } catch (e) {
      expect(
        stripAnsi(
          (e as { message: string }).message.replace(dirname, '<<DIRNAME>>')
        )
      ).toMatchSnapshot();
    }
  });

  it('does not strip instanbul coverage sequences', async () => {
    const { code, metadata } = await transformAsync(
      dedent`
      import { styled } from '@linaria/react';

      const a = 42;

      export const Title = styled.h1\`
        height: ${'${a}'}px;
      \`;
      `,
      {
        ...babelrc,
        cwd: '/home/user/project',
        filename: 'file.js',
        plugins: [
          [
            // eslint-disable-next-line import/no-extraneous-dependencies
            require('babel-plugin-istanbul').default({
              ...babel,
              assertVersion: () => {},
            }),
            { cwd: '/home/user/project' },
          ],
        ],
      }
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  // PR #524
  it('should work with String and Number object', async () => {
    const { code, metadata } = await transpile(
      dedent`
      import { css } from '@linaria/core';

      export const style = css\`
        width: ${'${new String("100%")}'};
        opacity: ${'${new Number(0.75)}'};
      \`;
      `
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should work with generated classnames as selectors', async () => {
    const { code, metadata } = await transpile(
      dedent`
      import { css } from "@linaria/core";

      export const text = css\`\`;

      export const square = css\`
        .${'${text}'} {
          color: red;
        }
      \`;
    `
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should process `css` calls inside components', async () => {
    const { code, metadata } = await transpile(
      dedent`
      import React from 'react'
      import {css} from '@linaria/core'

      export function Component() {
        const opacity = 0.2;
        const className = css\`
          opacity: ${'${opacity}'};
        \`;

        return React.createElement("div", { className });
      }
      `
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should process `styled` calls inside components', async () => {
    const { code, metadata } = await transpile(
      dedent`
      import React from 'react'
      import {css} from '@linaria/core'

      export function Component() {
        const opacity = 0.2;
        const MyComponent = styled.h1\`
          opacity: ${'${opacity}'};
        \`;

        return React.createElement(MyComponent);
      }
      `
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should process `css` calls with complex interpolation inside components', async () => {
    const { code, metadata } = await transpile(
      dedent`
      import React from 'react'
      import {css} from '@linaria/core'
      import externalDep from '@linaria/babel-preset/__fixtures__/sample-script';
      const globalObj = {
        opacity: 0.5,
      };

      export function Component() {
        const classes = {
          value: 0.2,
          cell: css\`
            opacity: 0;
          \`,
        };

        const classes2 = classes;
        const referencedExternalDep = externalDep

        const className = css\`
          opacity: ${'${globalObj.opacity}'};
          font-size: ${'${externalDep}'}
          font-size: ${'${referencedExternalDep}'}

          &:hover .${'${classes2.cell}'} {
            opacity: ${'${classes.value}'};
          }
        \`;

        return React.createElement("div", { className });
      }
      `
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should process `css` calls referencing other `css` calls inside components', async () => {
    const { code, metadata } = await transpile(
      dedent`
      import React from 'react'
      import {css} from '@linaria/core'

      export function Component() {
        const outer = css\`
          color: red;
        \`;

        const inner = css\`
          color: green;
          .${'${outer}'}:hover & {
            color: blue;
          }
        \`;

        return React.createElement("div", { className: outer },
          "outer",
          React.createElement("div", { className: inner },
            "inner"
          )
        );
      }
      `
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should process `styled` calls with complex interpolation inside components', async () => {
    const { code, metadata } = await transpile(
      dedent`
        import React from 'react'
        import {css} from '@linaria/core'

        const globalObj = {
          opacity: 0.5,
        };

        const Styled1 = styled.p\`
          opacity: ${'${globalObj.opacity}'}
        \`

        export function Component() {
          const classes = {
            value: 0.2,
            cell: css\`
              opacity: 0;
            \`,
          };

          const classes2 = classes;

          const MyComponent = styled\`
            opacity: ${'${globalObj.opacity}'};

            &:hover .${'${classes2.cell}'} {
              opacity: ${'${classes.value}'};
            }
            ${'${Styled1}'} {
              font-size: 1;
            }
          \`;

          return React.createElement(MyComponent);
        }
        `
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should handle shadowed identifier inside components', async () => {
    const { code, metadata } = await transpile(
      dedent`
        import React from 'react'
        import {css} from '@linaria/core'

        const color = 'red';

        export default function Component() {
          const color = 'blue'
          const val = { color };
          return React.createElement('div', {className: css\`background-color:${'${val.color}'};\`});
        }
        `
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('it should not throw location error for hoisted identifier', async () => {
    const { code, metadata } = await transpile(
      dedent`
        import React from 'react'
        import {css} from '@linaria/core'

        const size = () => 5
        export default function Component() {
          const color = size()
          return css\`opacity:${'${color}'};\`
        }
        `
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  strategyDependentTests(transpile);
}
