import * as babel from '@babel/core';
import dedent from 'dedent';
import { join, resolve } from 'path';
import stripAnsi from 'strip-ansi';

import Module from '../babel/module';
import serializer from '../__utils__/linaria-snapshot-serializer';
import { Evaluator, StrictOptions } from '../babel/types';

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

function run(
  evaluator: Evaluator,
  strategyDependentTests: (transpile: TranspileFn) => void = () => {}
): void {
  const babelrc: babel.TransformOptions = {
    babelrc: false,
    configFile: false,
    plugins: [],
    presets: [
      [
        require.resolve('../babel'),
        {
          displayName: true,
          evaluate: true,
          rules: [
            {
              action: evaluator,
            },
            {
              test: /\/node_modules\//,
              action: 'ignore',
            },
            {
              test: /\/src\/(?:core|react)\/\w+\.ts/,
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
    conf: (original: typeof babelrc) => typeof babelrc = i => i
  ) => {
    const { code, metadata } = await transformAsync(input, {
      ...conf(babelrc),
      filename: join(__dirname, 'source.js'),
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
      import { styled } from 'linaria/react';

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
      import { styled } from 'linaria/react';

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
        import { styled } from 'linaria/react';

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
        stripAnsi(e.message.replace(__dirname, '<<DIRNAME>>'))
      ).toMatchSnapshot();
    }
  });

  it('evaluates babel helpers', async () => {
    const { code, metadata } = await transpile(
      dedent`
      import { styled } from 'linaria/react';

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

  it('evaluates typescript enums', async () => {
    const { code, metadata } = await transpile(
      dedent`
      enum Colors {
        BLUE = '#27509A'
      }

      const Title = styled.h1\`
        color: ${'${Colors.BLUE}'};
      \`;
      `,
      config => ({
        ...config,
        plugins: [
          '@babel/plugin-transform-typescript',
          ...(config.plugins || []),
        ],
      })
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates local expressions', async () => {
    const { code, metadata } = await transpile(
      dedent`
      import { styled } from 'linaria/react';

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
      import { styled } from 'linaria/react';

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
      import { styled } from 'linaria/react';
      import slugify from '../slugify';

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
      import { styled } from 'linaria/react';
      const slugify = require('../slugify').default;

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
      import { styled } from 'linaria/react';
      const slugify = require('../slugify').default;

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
      import { styled } from 'linaria/react';

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
      import { styled } from 'linaria/react';

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
      const { styled } = require('../react');

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
        const { styled } = require('../react');

        let fontSize;

        export const Title = styled.h1\`
          font-size: ${'${fontSize}'};
        \`;
        `
      );
    } catch (e) {
      expect(
        stripAnsi(e.message.replace(__dirname, '<<DIRNAME>>'))
      ).toMatchSnapshot();
    }
  });

  it('throws when interpolation evaluates to null', async () => {
    expect.assertions(1);

    try {
      await transpile(
        dedent`
        const { styled } = require('../react');

        const color = null;

        export const Title = styled.h1\`
          color: ${'${color}'};
        \`;
        `
      );
    } catch (e) {
      expect(
        stripAnsi(e.message.replace(__dirname, '<<DIRNAME>>'))
      ).toMatchSnapshot();
    }
  });

  it('throws when interpolation evaluates to NaN', async () => {
    expect.assertions(1);

    try {
      await transpile(
        dedent`
        const { styled } = require('../react');

        const height = NaN;

        export const Title = styled.h1\`
          height: ${'${height}'}px;
        \`;
        `
      );
    } catch (e) {
      expect(
        stripAnsi(e.message.replace(__dirname, '<<DIRNAME>>'))
      ).toMatchSnapshot();
    }
  });

  it('handles wrapping another styled component', async () => {
    const { code, metadata } = await transpile(
      dedent`
      const { css } = require('..');
      const { styled } = require('../react');

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
      const { styled } = require('../react');

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
      import { styled } from 'linaria/react';

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
      import { styled } from 'linaria/react';

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
      import { styled } from 'linaria/react';

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
      import { styled } from 'linaria/react';
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
      config => ({
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
      import { styled } from 'linaria/react';

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
      import { styled } from 'linaria/react';

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
      import { css } from '../index.ts';
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
        import { styled } from 'linaria/react';

        const foo = props => { throw new Error('This will fail') };

        export const Title = styled.h1\`
          font-size: ${'${foo()}'}px;
        \`;
        `
      );
    } catch (e) {
      expect(
        stripAnsi(e.message.replace(__dirname, '<<DIRNAME>>'))
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
      import { styled } from 'linaria/react';

      export default styled.h1\`
        font-size: 14px;
      \`;
      `,
      {
        ...babelrc,
        filename: join(__dirname, 'FancyName.js'),
      }
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('derives display name from parent folder name', async () => {
    const { code, metadata } = await transformAsync(
      dedent`
      import { styled } from 'linaria/react';

      export default styled.h1\`
        font-size: 14px;
      \`;
      `,
      {
        ...babelrc,
        filename: join(__dirname, 'FancyName/index.js'),
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
        import { styled } from 'linaria/react';

        export default styled.h1\`
          font-size: 14px;
        \`;
        `,
        {
          ...babelrc,
          filename: join(__dirname, '/.js'),
        }
      );
    } catch (e) {
      expect(
        stripAnsi(e.message.replace(__dirname, '<<DIRNAME>>'))
      ).toMatchSnapshot();
    }
  });

  it('does not strip instanbul coverage sequences', async () => {
    const { code, metadata } = await transformAsync(
      dedent`
      import { styled } from 'linaria/react';

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
      import { css } from 'linaria';

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
      import { css } from "linaria";

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

  strategyDependentTests(transpile);
}

describe('shaker', () => {
  run(require('../babel/evaluators/shaker').default, transpile => {
    it('should work with wildcard imports', async () => {
      const { code, metadata } = await transpile(
        dedent`
      import { css } from "linaria";
      import * as mod from "../__fixtures__/complex-component";

      export const square = css\`
        ${'${mod.Title}'} {
          color: red;
        }
      \`;
    `
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('should interpolate imported components', async () => {
      const { code, metadata } = await transpile(
        dedent`
      import { css } from "linaria";
      import { Title } from "../__fixtures__/complex-component";

      export const square = css\`
        ${'${Title}'} {
          color: red;
        }
      \`;
    `
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('should interpolate imported variables', async () => {
      const { code, metadata } = await transpile(
        dedent`
      import { css } from "linaria";
      import { whiteColor } from "../__fixtures__/complex-component";

      export const square = css\`
        color: ${'${whiteColor}'}
      \`;
    `
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });
  });
});

describe('extractor', () => {
  run(require('../babel/evaluators/extractor').default);
});
