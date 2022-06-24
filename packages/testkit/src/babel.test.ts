import { join, resolve } from 'path';

import * as babel from '@babel/core';
import type { PluginTarget, PluginItem } from '@babel/core';
import dedent from 'dedent';
import stripAnsi from 'strip-ansi';

import type { StrictOptions, Evaluator } from '@linaria/babel-preset';
import { Module } from '@linaria/babel-preset';

import serializer from './__utils__/linaria-snapshot-serializer';

expect.addSnapshotSerializer(serializer);

const dirName = __dirname;

type Config = babel.TransformOptions & {
  presets: [[PluginTarget, StrictOptions], ...PluginItem[]];
};

const getBabelConfig = (
  evaluator: Evaluator,
  linariaConfig: Partial<StrictOptions> = {},
  extension: 'js' | 'ts' | 'jsx' | 'tsx' = 'js'
): Config => {
  const presets: PluginItem[] = [];
  const plugins: PluginItem[] = [];
  if (extension === 'ts' || extension === 'tsx') {
    presets.push(require.resolve('@babel/preset-typescript'));
  }

  if (extension === 'jsx' || extension === 'tsx') {
    presets.push(require.resolve('@babel/preset-react'));
  }

  return {
    filename: join(dirName, `source.${extension}`),
    babelrc: false,
    configFile: false,
    plugins,
    presets: [
      [
        require.resolve('@linaria/babel-preset'),
        {
          babelOptions: {
            presets,
            plugins,
          },
          displayName: true,
          rules: [
            {
              action: evaluator,
            },
            {
              test: /\/node_modules\/(?!@linaria)/,
              action: 'ignore',
            },
          ],
          evaluate: true,
          ...linariaConfig,
        },
      ],
      ...presets,
    ],
  };
};

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

const strategies: [string, Evaluator][] = [
  ['extractor', require('@linaria/extractor').default],
  ['shaker', require('@linaria/shaker').default],
];

const truncateTestName = (testName: string) => {
  const prefixLength = testName.split(' ', 2).join('').length + 2;
  return testName.slice(prefixLength);
};

const prefixes = strategies.map(([name]) => `strategy ${name}`);

/*
 * After each test, we check that the result is the same for all strategies.
 */
function validateSnapshots() {
  const state = expect.getState();
  const { snapshotState, currentTestName } = state;
  if (snapshotState.unmatched > 0) {
    // If there are unmatched snapshots, don't check equality.
    return;
  }

  const snapshotData: Record<string, string> = snapshotState._snapshotData;
  const testName = truncateTestName(currentTestName);

  let i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const set = new Set();
    // eslint-disable-next-line no-restricted-syntax
    for (const prefix of prefixes) {
      const snapshot = snapshotData[`${prefix} ${testName} ${i}`];

      if (snapshot) {
        set.add(snapshot);
      }
    }

    if (set.size === 0) {
      return;
    }

    if (set.size > 1) {
      const values = Array.from(set);
      expect(values[0]).toBe(values[1]);
    }

    i += 1;
  }
}

describe('strategy', () => {
  describe.each(strategies)('%s', (strategyName, evaluator) => {
    afterEach(() => {
      validateSnapshots();
    });

    beforeEach(() => {
      Module.invalidateEvalCache();
    });

    it('transpiles styled template literal with object', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    import { styled } from '@linaria/react';

    export const Title = styled.h1\`
      font-size: 14px;
    \`;
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('uses string passed in as classNameSlug', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    import { styled } from '@linaria/react';

    export const Title = styled('h1')\`
      font-size: 14px;
    \`;
`,
        getBabelConfig(evaluator, {
          classNameSlug: ['hash', 'title', 'file', 'name', 'ext', 'dir']
            .map((s) => `[${s}]`)
            .join('_'),
        })
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('removes fake replacement patterns in string classNameSlug', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    import { styled } from '@linaria/react';

    export const Title = styled('h1')\`
      font-size: 14px;
    \`;
`,
        getBabelConfig(evaluator, {
          classNameSlug: '[not]_[actual]_[replacements]',
        })
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('handles fn passed in as classNameSlug', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    import { styled } from '@linaria/react';

    export const Title = styled('h1')\`
      font-size: 14px;
    \`;
`,
        getBabelConfig(evaluator, {
          classNameSlug: (hash, title, vars) =>
            [
              hash,
              title,
              vars.hash,
              vars.title,
              vars.file,
              vars.name,
              vars.ext,
              vars.dir,
            ].join('_'),
        })
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('transpiles styled template literal with function and tag', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    import { styled } from '@linaria/react';

    export const Title = styled('h1')\`
      font-size: 14px;
    \`;
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('transpiles renamed styled import', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    import { styled as custom } from '@linaria/react';

    export const Title = custom('h1')\`
      font-size: 14px;
    \`;
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('transpiles renamed css and atomic-css imports in the same file', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    /* @flow */

    import { css as coreCss } from '@linaria/core';
    import { css as atomicCss } from '@linaria/atomic';

    const x = coreCss\`
      background: red;
    \`;

    const y = atomicCss\`
      background: red;
    \`;

    console.log(x, y);
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('transpiles renamed styled and atomic-styled imports in the same file', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    /* @flow */

    import { styled as reactStyled } from '@linaria/react';
    import { styled as atomicStyled } from '@linaria/atomic';

    const StyledComponent = reactStyled.div\`
      background: red;
    \`;
    const StyledComponent2 = reactStyled(StyledComponent)\`
      background: blue;
    \`;

    const AtomicComponent = atomicStyled.div\`
      background: red;
    \`;
    const AtomicComponent2 = atomicStyled(AtomicComponent)\`
      background: blue;
    \`;

    console.log(StyledComponent, StyledComponent2, AtomicComponent, AtomicComponent2);
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('transpiles renamed css from linaria v2', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    import {css as coreCss} from 'linaria';

    const x = coreCss\`
      background: red;
    \`;

    console.log(x);
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('transpiles styled template literal with function and component', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    import { styled } from '@linaria/react';
    const Heading = () => null;

    export const Title = styled(Heading)\`
      font-size: 14px;
    \`;
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('transpiles styled template literal with TS component', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    import { styled } from '@linaria/react';

    type Props = { className?: string; children?: React.ReactNode };

    export const Title = styled((props: Props) => null)\`
      font-size: 14px;
    \`;
    `,
        getBabelConfig(
          evaluator,
          {
            evaluate: false,
          },
          'ts'
        )
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('transpiles with typed fn as interpolated value', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    import { styled } from '@linaria/react';

    type Props = { className?: string; children?: React.ReactNode };

    export const Title = styled.div\`
      font-size: 14px;
      content: "${'${(props: Props) => props.className}'}"
    \`;
    `,
        getBabelConfig(
          evaluator,
          {
            evaluate: false,
          },
          'ts'
        )
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('outputs valid CSS classname', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    import { styled } from '@linaria/react';

    export const ΩPage$Title = styled.h1\`
      font-size: 14px;
    \`;
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('evaluates nested nested object interpolation', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    import { css } from '@linaria/core';

    const defaultStyle = css\`
      color: red;
      padding-bottom: ${'${0}'}px;
    \`;

    const obj = {
      [\`&.${'${defaultStyle}'} .green\`]: {
        display: "inline-block",
        border: "1px solid green",
      },
    };

    export const greenContentStyles = css\`
      ${'${obj}'}
    \`;
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('keeps cx import and removes css', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    import { css, cx } from '@linaria/core';

    const defaultStyle = css\`
      color: red;
    \`;

    export const combined = cx(defaultStyle, Math.random() > 0.5 ? 'green' : 'red');
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('evaluates and inlines expressions in scope', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    import { styled } from '@linaria/react';

    const color = 'blue';

    export const Title = styled.h1\`
      color: ${'${color}'};
      width: ${'${100 / 3}'}%;
    \`;
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('inlines object styles as CSS string', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    import { styled } from '@linaria/react';

    const cover = {
      '--color-primaryText': '#222',
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      opacity: 1,
      minHeight: 420,

      '&.shouldNotBeChanged': {
        borderColor: '#fff',
      },

      '@media (min-width: 200px)': {
        WebkitOpacity: .8,
        MozOpacity: .8,
        msOpacity: .8,
        OOpacity: .8,
        WebkitBorderRadius: 2,
        MozBorderRadius: 2,
        msBorderRadius: 2,
        OBorderRadius: 2,
        WebkitTransition: '400ms',
        MozTransition: '400ms',
        OTransition: '400ms',
        msTransition: '400ms',
      }
    };

    export const Title = styled.h1\`
      ${'${cover}'}
    \`;
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('inlines array styles as CSS string', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    import { styled } from '@linaria/react';

    const styles = [
      { flex: 1 },
      { display: 'block', height: 24 },
    ];

    export const Title = styled.h1\`
      ${'${styles}'}
    \`;
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('handles interpolation followed by unit', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    import { styled } from '@linaria/react';

    const size = () => 100;
    const shadow = () => 5;
    const unit = () => 1;

    export const Title = styled.h1\`
      font-size: ${'${size}'}em;
      text-shadow: black 1px ${'${shadow}'}px, white -2px -2px;
      margin: ${'${size}'}px;
      width: calc(2 * ${'${props => props.width}'}vw);
      height: ${'${props => { if (true) { return props.height } else { return 200 } }}'}px;
      grid-template-columns: ${'${unit}'}fr 1fr 1fr ${'${unit}'}fr;
      border-radius: ${'${function(props) { return 200 }}'}px
    \`;
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('uses the same custom property for the same identifier', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    import { styled } from '@linaria/react';

    const size = () => 100;

    export const Box = styled.div\`
      height: ${'${size}'}px;
      width: ${'${size}'}px;
    \`;
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('uses the same custom property for the same expression', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    import { styled } from '@linaria/react';

    export const Box = styled.div\`
      height: ${'${props => props.size}'}px;
      width: ${'${props => props.size}'}px;
    \`;
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('handles nested blocks', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    import { styled } from '@linaria/react';

    const regular = () => "arial";

    export const Button = styled.button\`
      font-family: ${'${regular}'};

      &:hover {
        border-color: blue;
      }

      @media (max-width: 200px) {
        width: 100%;
      }
    \`;
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('prevents class name collision', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    import { styled } from '@linaria/react';

    const size = () => 100;
    const regular = () => "arial";

    export const Title = styled.h1\`
      font-size: ${'${size}'}px;
      color: ${'${props => props.color}'}
    \`;

    export function Something() {
      const Title = styled.h1\`
        font-family: ${'${regular}'};
      \`;

      return <Title />;
    }
    `,
        getBabelConfig(evaluator, {}, 'jsx')
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('does not output CSS if none present', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      const number = 42;

      const title = String.raw\`This is something\`;
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('does not output CSS property when value is a blank string', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    import { css } from '@linaria/core';

    export const title = css\`
      font-size: ${''};
      margin: 6px;
    \`;
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('transpiles css template literal', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    import { css } from '@linaria/core';

    export const title = css\`
      font-size: 14px;
    \`;
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('handles css template literal in object property', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    import { css } from '@linaria/core';

    const components = {
      title: css\`
        font-size: 14px;
      \`
    };
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('handles css template literal in JSX element', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    import { css } from '@linaria/core';

    <Title class={css\` font-size: 14px; \`} />
    `,
        getBabelConfig(evaluator, {}, 'jsx')
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('throws when contains unsupported expression', async () => {
      expect.assertions(1);

      try {
        await transformAsync(
          dedent`
      import { css } from '@linaria/core';

      const size = 100;

      const title = css\`
        font-size: ${'${() => size}'}px;
      \`;
      `,
          getBabelConfig(evaluator)
        );
      } catch (e) {
        expect(
          stripAnsi(
            (e as { message: string }).message.replace(dirName, '<<DIRNAME>>')
          )
        ).toMatchSnapshot();
      }
    });

    it('supports both css and styled tags', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { css } from '@linaria/core';
      import { styled } from '@linaria/react';

      export const Title = styled.h1\`
        font-size: 14px;
      \`;

      export const title = css\`
        color: blue;
      \`;
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('does not include styles if not referenced anywhere', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { css } from '@linaria/core';
      import { styled } from '@linaria/react';

      const Title = styled.h1\`
        font-size: 14px;
      \`;

      const title = css\`
        color: blue;
      \`;
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('includes unreferenced styles for :global', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { css } from '@linaria/core';
      import { styled } from '@linaria/react';

      const a = css\`
        :global() {
          .title {
            font-size: 14px;
          }
        }
      \`;

      const B = styled.div\`
        :global(.title) {
          font-size: 14px;
        }
      \`;
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('handles objects with numeric keys', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { css } from '@linaria/core';

      export const object = {
        stringKey: css\`\`,
        42: css\`\`,
      }
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('handles objects with enums as keys', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { css } from '@linaria/core';
      import { TestEnum } from './ts-data.ts';

      export const object = {
        [TestEnum.FirstValue]: css\`\`,
        [TestEnum.SecondValue]: css\`\`,
      }
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('compiles atomic css', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    /* @flow */

    import { css } from '@linaria/atomic';
    import { styled } from '@linaria/react';

    const x = css\`
      background: red;
      height: 100px;
    \`;

    console.log(x);

      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('compiles atomic css with property priorities', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    /* @flow */

    import { css } from '@linaria/atomic';
    import { styled } from '@linaria/react';

    const y = css\`
      margin-left: 5px;
    \`;

    const x = css\`
      margin: 0;
    \`;

    console.log(x, y);

      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('compiles atomic css with at-rules and pseudo classes', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    /* @flow */

    import { css } from '@linaria/atomic';
    import { styled } from '@linaria/react';

    const x = css\`
      @media (max-width: 500px) {
        background: blue;
      }
      @media (min-width: 300px) {
        &:hover {
          background: purple;
        }
      }
      &:enabled {
        width: 100%;
      }
      background: red;
      height: 100px;
    \`;

    console.log(x);

      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('compiles atomic css with at-rules and property priorities', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    /* @flow */

    import { css } from '@linaria/atomic';
    import { styled } from '@linaria/react';

    const x = css\`
      @media (max-width: 500px) {
        padding: 0;
      }
      @media (min-width: 300px) {
        &:hover {
          padding-top: 5px;
        }
      }
      &:enabled {
        padding-left: 6px;
      }
      padding-bottom: 7px;
    \`;

    console.log(x);
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('compiles atomic css with keyframes', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    /* @flow */

    import { css } from '@linaria/atomic';
    import { styled } from '@linaria/react';

    const x = css\`
      @keyframes fade {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      animation: fade 1s infinite;

      background: red;
      height: 100px;
    \`;

    console.log(x);

      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('compiles atomic styled with static css', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    /* @flow */

    import { styled } from '@linaria/atomic';

    const Component = styled.div\`
      color: blue;
      height: 100px;
    \`;

    console.log(Component);

      `,
        getBabelConfig(evaluator)
      );
      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('compiles atomic css with unique atoms based on key value pairs', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    /* @flow */
    import { css } from '@linaria/atomic';
    const x = css\`
      height: 100px;
    \`;
    const y = css\`
      height: 99px
    \`;
    console.log(x, y);
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('compiles atomic styled with plain css, static and dynamic interpolations', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    /* @flow */

    import { styled } from '@linaria/atomic';

    const Component = styled.div\`
      color: blue;
      height: 100px;
      margin: ${'${100 / 2}'}px;
      background-color: ${'${props => props.color}'};
    \`;

    console.log(Component);

      `,
        getBabelConfig(evaluator)
      );
      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('compiles atoms that are shared between css and styled templates', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    /* @flow */

    import { css } from '@linaria/atomic';
    import { styled } from '@linaria/atomic';

    const x = css\`
      background: red;
      height: 100px;
    \`

    const Component = styled.div\`
      background: red;
      height: ${'${200 / 2}'}px;
      margin: 10px;
      color: ${'${props => props.color}'};
    \`;

    console.log(x, Component);

      `,
        getBabelConfig(evaluator)
      );
      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('compiles atomic styled wrapping other components with extra priority', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    /* @flow */

    import { styled } from '@linaria/atomic';

    const Component = styled.div\`
      background-color: blue;
      height: 100px;
    \`;

    const ComponentCompositing = styled(Component)\`
      background: red;
      height: 105px;
    \`;

    console.log(ComponentCompositing);

      `,
        getBabelConfig(evaluator)
      );
      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('compiles atomic styled without colliding by property', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    /* @flow */

    import { styled } from '@linaria/atomic';

    export const Component = styled.ul\`
      display: flex;
      padding: 0;
    \`;

    export const Component2 = styled.ul\`
      display: block;
      padding: 0;
    \`;

      `,
        getBabelConfig(evaluator)
      );
      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('compiles atomic styled with dynamic interpolations as unique variables based on the interpolation text', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
    /* @flow */

    import { styled } from '@linaria/atomic';

    const Component = styled.div\`
      color: ${'${props => props.color}'};
      border-color: ${'${props => props.color}'};
      background-color: ${'${props => props.backgroundColor}'};
    \`;

    const Component2 = styled.div\`
      color: ${'${props => props.color}'};
      border-color: ${'${props => props.color || "black"}'};
    \`;

    console.log(Component, Component2);

      `,
        getBabelConfig(evaluator)
      );
      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('evaluates identifier in scope', async () => {
      const { code, metadata } = await transformAsync(
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
      `,
        getBabelConfig(evaluator)
      );
      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('hoistable identifiers', async () => {
      const { code, metadata } = await transformAsync(
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
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('non-hoistable identifiers', async () => {
      expect.assertions(1);

      try {
        await transformAsync(
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
        `,
          getBabelConfig(evaluator)
        );
      } catch (e) {
        expect(
          stripAnsi(
            (e as { message: string }).message.replace(dirName, '<<DIRNAME>>')
          )
        ).toMatchSnapshot();
      }
    });

    it('evaluates imported typescript enums', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { styled } from '@linaria/react';
      import { Colors } from './__fixtures__/enums';

      export const Title = styled.h1\`
        color: ${'${Colors.BLUE}'};
      \`;
      `,
        getBabelConfig(evaluator, {}, 'ts')
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('evaluates local expressions', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { styled } from '@linaria/react';

      const answer = 42;
      const foo = () => answer;

      export const Title = styled.h1\`
        &:before {
          content: "${"${foo() + ' days'}"}"
        }
      \`;
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('evaluates functions with nested identifiers', async () => {
      const { code, metadata } = await transformAsync(
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
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('evaluates expressions with dependencies', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { styled } from '@linaria/react';
      import slugify from './__fixtures__/slugify';

      export const Title = styled.h1\`
        &:before {
          content: "${"${slugify('test')}"}"
        }
      \`;
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('evaluates expressions with expressions depending on shared dependency', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { styled } from '@linaria/react';
      const slugify = require('./__fixtures__/slugify').default;

      const boo = t => slugify(t) + 'boo';
      const bar = t => slugify(t) + 'bar';

      export const Title = styled.h1\`
        &:before {
          content: "${"${boo('test') + bar('test')}"}"
        }
      \`;
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('evaluates multiple expressions with shared dependency', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { styled } from '@linaria/react';
      const slugify = require('./__fixtures__/slugify').default;

      const boo = t => slugify(t) + 'boo';
      const bar = t => slugify(t) + 'bar';

      export const Title = styled.h1\`
        &:before {
          content: "${"${boo('test')}"}"
          content: "${"${bar('test')}"}"
        }
      \`;
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('evaluates interpolations with sequence expression', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { styled } from '@linaria/react';
      let external = 0;
      export const Title = styled.h1\`
        color: ${'${(external, () => "blue")}'};
      \`;
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('evaluates dependencies with sequence expression', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { styled } from '@linaria/react';
      let external = 0;
      const color = (external, () => 'blue');

      export const Title = styled.h1\`
        color: ${'${color}'};
      \`;
      `,
        getBabelConfig(evaluator)
      );
      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('evaluates component interpolations', async () => {
      const { code, metadata } = await transformAsync(
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
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('throws when interpolation evaluates to undefined', async () => {
      expect.assertions(1);

      try {
        await transformAsync(
          dedent`
        const { styled } = require('@linaria/react');

        let fontSize;

        export const Title = styled.h1\`
          font-size: ${'${fontSize}'};
        \`;
        `,
          getBabelConfig(evaluator)
        );
      } catch (e) {
        expect(
          stripAnsi(
            (e as { message: string }).message.replace(dirName, '<<DIRNAME>>')
          )
        ).toMatchSnapshot();
      }
    });

    it('throws when interpolation evaluates to null', async () => {
      expect.assertions(1);

      try {
        await transformAsync(
          dedent`
        const { styled } = require('@linaria/react');

        const color = null;

        export const Title = styled.h1\`
          color: ${'${color}'};
        \`;
        `,
          getBabelConfig(evaluator)
        );
      } catch (e) {
        expect(
          stripAnsi(
            (e as { message: string }).message.replace(dirName, '<<DIRNAME>>')
          )
        ).toMatchSnapshot();
      }
    });

    it('throws when interpolation evaluates to NaN', async () => {
      expect.assertions(1);

      try {
        await transformAsync(
          dedent`
        const { styled } = require('@linaria/react');

        const height = NaN;

        export const Title = styled.h1\`
          height: ${'${height}'}px;
        \`;
        `,
          getBabelConfig(evaluator)
        );
      } catch (e) {
        expect(
          stripAnsi(
            (e as { message: string }).message.replace(dirName, '<<DIRNAME>>')
          )
        ).toMatchSnapshot();
      }
    });

    it('handles wrapping another styled component', async () => {
      const { code, metadata } = await transformAsync(
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
      `,
        getBabelConfig(evaluator)
      );
      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('handles indirect wrapping another styled component', async () => {
      const { code, metadata } = await transformAsync(
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
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('inlines object styles as CSS string', async () => {
      const { code, metadata } = await transformAsync(
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
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('inlines array styles as CSS string', async () => {
      const { code, metadata } = await transformAsync(
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
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('ignores inline arrow function expressions', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { styled } from '@linaria/react';

      export const Title = styled.h1\`
        &:before {
          content: "${'${props => props.content}'}"
        }
      \`;
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('simplifies react components', async () => {
      const div = '<div>{props.children + constant}</div>';
      const { code, metadata } = await transformAsync(
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
        getBabelConfig(evaluator, {}, 'jsx')
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('ignores inline vanilla function expressions', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { styled } from '@linaria/react';

      export const Title = styled.h1\`
        &:before {
          content: "${'${function(props) { return props.content }}'}"
        }
      \`;
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('ignores external expressions', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { styled } from '@linaria/react';

      const generate = props => props.content;

      export const Title = styled.h1\`
        &:before {
          content: "${'${generate}'}"
        }
      \`;
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('throws codeframe error when evaluation fails', async () => {
      expect.assertions(1);

      try {
        await transformAsync(
          dedent`
        import { styled } from '@linaria/react';

        const foo = props => { throw new Error('This will fail') };

        export const Title = styled.h1\`
          font-size: ${'${foo()}'}px;
        \`;
        `,
          getBabelConfig(evaluator)
        );
      } catch (e) {
        expect(
          stripAnsi(
            (e as { message: string }).message.replace(dirName, '<<DIRNAME>>')
          )
        ).toMatchSnapshot();
      }
    });

    it('generates stable class names', async () => {
      const { code, metadata } = await transformFileAsync(
        resolve(__dirname, './__fixtures__/components-library.js'),
        getBabelConfig(evaluator)
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
          ...getBabelConfig(evaluator),
          filename: join(dirName, 'FancyName.js'),
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
          ...getBabelConfig(evaluator),
          filename: join(dirName, 'FancyName/index.js'),
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
            ...getBabelConfig(evaluator),
            filename: join(dirName, '/.js'),
          }
        );
      } catch (e) {
        expect(
          stripAnsi(
            (e as { message: string }).message.replace(dirName, '<<DIRNAME>>')
          )
        ).toMatchSnapshot();
      }
    });

    it('does not strip istanbul coverage sequences', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      const a = 42;

      export const Title = \`
        height: ${'${a}'}px;
      \`;
      `,
        {
          ...getBabelConfig(evaluator),
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
      const { code, metadata } = await transformAsync(
        dedent`
      import { css } from '@linaria/core';

      export const style = css\`
        width: ${'${new String("100%")}'};
        opacity: ${'${new Number(0.75)}'};
      \`;
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('should work with generated classnames as selectors', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { css } from "@linaria/core";

      export const text = css\`\`;

      export const square = css\`
        .${'${text}'} {
          color: red;
        }
      \`;
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('should process `css` calls inside components', async () => {
      const { code, metadata } = await transformAsync(
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
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('should process `styled` calls inside components', async () => {
      const { code, metadata } = await transformAsync(
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
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('should process `css` calls with complex interpolation inside components', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import React from 'react'
      import {css} from '@linaria/core'
      import externalDep from './__fixtures__/sample-script';
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
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('should process `css` calls referencing other `css` calls inside components', async () => {
      const { code, metadata } = await transformAsync(
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
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('should process `styled` calls with complex interpolation inside components', async () => {
      const { code, metadata } = await transformAsync(
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
        `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('should handle shadowed identifier inside components', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
        import React from 'react'
        import {css} from '@linaria/core'

        const color = 'red';

        export default function Component() {
          const color = 'blue'
          const val = { color };
          return React.createElement('div', {className: css\`background-color:${'${val.color}'};\`});
        }
        `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('it should not throw location error for hoisted identifier', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
        import React from 'react'
        import {css} from '@linaria/core'

        const size = () => 5
        export default function Component() {
          const color = size()
          return css\`opacity:${'${color}'};\`
        }
        `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('should wrap memoized components', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
        import React from 'react';
        import { styled } from '@linaria/react';

        const MyComponent = React.memo(() => <div />);

        export default styled(MyComponent)\`
          color: red;
        \`
        `,
        getBabelConfig(evaluator, {}, 'jsx')
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    // The rest of tests are too complicated for extractor strategy
    if (strategyName === 'extractor') return;

    it('handles escapes properly', async () => {
      const { code, metadata } = await transformFileAsync(
        resolve(__dirname, './__fixtures__/escape-character.js'),
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('evaluates babel helpers', async () => {
      const { code, metadata } = await transformAsync(
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
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('evaluates complex styles with functions and nested selectors', async () => {
      const { code, metadata } = await transformAsync(
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
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('should work with wildcard imports', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { css } from "@linaria/core";
      import * as mod from "./__fixtures__/complex-component";

      const color = mod["whiteColor"];

      export const square = css\`
        ${'${mod.Title}'} {
          color: ${'${color}'};
        }
      \`;
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('assigning to exports', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { css } from "@linaria/core";
      import { Padding } from "./__fixtures__/assignToExport";

      export const square = css\`
        div {
          padding: ${'${Padding}'}px;
        }
      \`;
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('exporting objects', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { css } from "@linaria/core";
      import object from "./__fixtures__/objectExport";

      export const square = css\`
        div {
          margin: ${'${object.margin}'}px;
        }
      \`;
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('exporting objects with computed keys', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { css } from "@linaria/core";
      import { object } from "./__fixtures__/computedKeys";

      export const square = css\`
        div {
          color: ${'${object.blue}'};
        }
      \`;
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('exporting sequence expressions', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { css } from "@linaria/core";
      import number from "./__fixtures__/sequenceExport";

      export const square = css\`
        div {
          height: ${'${number}'}px;
        }
      \`;
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('should work with wildcard reexports', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { css } from "@linaria/core";
      import { foo1 } from "./__fixtures__/reexports";

      export const square = css\`
        color: ${'${foo1}'};
      \`;
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('should interpolate imported components', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { css } from "@linaria/core";
      import { Title } from "./__fixtures__/complex-component";

      export const square = css\`
        ${'${Title}'} {
          color: red;
        }
      \`;
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('should interpolate imported variables', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { css } from "@linaria/core";
      import { whiteColor } from "./__fixtures__/complex-component";

      export const square = css\`
        color: ${'${whiteColor}'}
      \`;
    `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('evaluates typescript enums', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { styled } from '@linaria/react';

      enum Colors {
        BLUE = '#27509A'
      }

      export const Title = styled.h1\`
        color: ${'${Colors.BLUE}'};
      \`;
      `,
        getBabelConfig(evaluator, {}, 'ts')
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('evaluates chain of reexports', async () => {
      const { code, metadata } = await transformAsync(
        dedent`
      import { styled } from '@linaria/react';
      import { fooStyles } from "./__fixtures__/re-exports";

      const value = fooStyles.foo;

      export const H1 = styled.h1\`
        color: ${'${value}'};
      \`
      `,
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('handles complex component', async () => {
      const { code, metadata } = await transformFileAsync(
        resolve(__dirname, './__fixtures__/complex-component.js'),
        getBabelConfig(evaluator)
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });
  });
});
