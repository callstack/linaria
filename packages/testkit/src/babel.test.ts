/* eslint-disable no-restricted-syntax */
import { readFileSync } from 'fs';
import { dirname, join, resolve, sep } from 'path';

import * as babel from '@babel/core';
import type { PluginItem } from '@babel/core';
import dedent from 'dedent';
import stripAnsi from 'strip-ansi';

import type { PluginOptions, Stage } from '@linaria/babel-preset';
import {
  transform as linariaTransform,
  loadLinariaOptions,
  TransformCacheCollection,
  Entrypoint,
} from '@linaria/babel-preset';
import { linariaLogger } from '@linaria/logger';
import type {
  Evaluator,
  OnEvent,
  OnActionStartArgs,
  OnActionFinishArgs,
  FeatureFlags,
} from '@linaria/utils';
import { EventEmitter } from '@linaria/utils';
import type { EntrypointEvent } from '@linaria/utils/types/EventEmitter';

import serializer from './__utils__/linaria-snapshot-serializer';

expect.addSnapshotSerializer(serializer);

const dirName = __dirname;

type PartialOptions = Partial<Omit<PluginOptions, 'features'>> & {
  features?: Partial<FeatureFlags>;
};

type Options = [
  evaluator: Evaluator,
  linariaConfig?: PartialOptions,
  extension?: 'js' | 'ts' | 'jsx' | 'tsx',
  filename?: string,
  babelConfig?: babel.TransformOptions,
];

const asyncResolve = (what: string, importer: string, stack: string[]) => {
  const where = [importer, ...stack].map((p) => dirname(p));
  try {
    return Promise.resolve(require.resolve(what, { paths: where }));
  } catch {
    return Promise.reject();
  }
};

const getPresets = (extension: 'js' | 'ts' | 'jsx' | 'tsx') => {
  const presets: PluginItem[] = [];
  if (extension === 'ts' || extension === 'tsx') {
    presets.push(require.resolve('@babel/preset-typescript'));
  }

  if (extension === 'jsx' || extension === 'tsx') {
    presets.push(require.resolve('@babel/preset-react'));
  }

  return presets;
};

const getLinariaConfig = (
  evaluator: Evaluator,
  linariaConfig: PartialOptions,
  presets: PluginItem[],
  stage?: Stage
): PluginOptions =>
  loadLinariaOptions({
    babelOptions: {
      presets,
      plugins: [],
    },
    displayName: true,
    rules: [
      {
        action: evaluator,
        babelOptions: {
          plugins: [
            require.resolve('@babel/plugin-transform-modules-commonjs'),
          ],
        },
      },
      {
        test: /[\\/]node_modules[\\/](?!@linaria)/,
        action: 'ignore',
      },
    ],
    features: {
      softErrors: false,
    },
    stage,
    ...linariaConfig,
  });

async function transform(
  originalCode: string,
  opts: Options,
  cache?: TransformCacheCollection,
  eventEmitter?: EventEmitter,
  filename = 'source'
) {
  const [
    evaluator,
    linariaPartialConfig = {},
    extension = 'js',
    fullFilename = join(dirName, `${filename}.${extension}`),
    babelPartialConfig = {},
  ] = opts;

  const presets = getPresets(extension);
  const linariaConfig = getLinariaConfig(
    evaluator,
    linariaPartialConfig,
    presets,
    'collect'
  );

  const services = {
    babel,
    cache,
    options: {
      filename: babelPartialConfig.filename ?? fullFilename,
      root: babelPartialConfig.root ?? undefined,
      inputSourceMap: babelPartialConfig.inputSourceMap ?? undefined,
      pluginOptions: linariaConfig,
    },
    eventEmitter,
  };
  const result = await linariaTransform(services, originalCode, asyncResolve);

  return {
    code: result.code,
    metadata: {
      linaria: {
        rules: result.rules,
        dependencies: result.dependencies,
      },
    },
  };
}

async function transformFile(filename: string, opts: Options) {
  const [evaluator, linariaPartialConfig = {}, extension = 'js'] = opts;
  const code = readFileSync(filename, 'utf8');
  return transform(code, [
    evaluator,
    linariaPartialConfig,
    extension,
    filename,
  ]);
}

describe('strategy shaker', () => {
  const evaluator = require('@linaria/shaker').default;
  let onEvent: jest.Mock<void, Parameters<OnEvent>>;
  let onAction: jest.Mock<number, OnActionStartArgs | OnActionFinishArgs>;
  let onEntrypointEvent: jest.Mock<
    void,
    [idx: number, timestamp: number, event: EntrypointEvent]
  >;
  let emitter: EventEmitter;

  function hasNotBeenProcessed(filename: string) {
    expect(onEntrypointEvent).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({
        filename,
        type: 'created',
      })
    );

    const entrypointId = onEntrypointEvent.mock.calls.find(
      (call) => call[2].type === 'created' && call[2].filename === filename
    )![0];

    expect(onEntrypointEvent).not.toHaveBeenCalledWith(
      entrypointId,
      expect.any(Number),
      expect.objectContaining({
        type: 'actionCreated',
        actionType: 'explodeReexports',
      })
    );
  }

  beforeEach(() => {
    onEvent = jest.fn();
    onAction = jest.fn();
    onEntrypointEvent = jest.fn();
    emitter = new EventEmitter(onEvent, onAction, onEntrypointEvent);
  });

  it('transpiles styled template literal with object', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { styled } from '@linaria/react';

    export const Title = styled.h1\`
      font-size: 14px;
    \`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('uses string passed in classNameSlug', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { styled } from '@linaria/react';

    export const Title = styled('h1')\`
      font-size: 14px;
    \`;
`,
      [
        evaluator,
        {
          classNameSlug: ['hash', 'title', 'file', 'name', 'ext', 'dir']
            .map((s) => `[${s}]`)
            .join('_'),
        },
      ]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('uses string passed in variableNameSlug', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { styled as atomicStyled } from '@linaria/atomic';
    import { styled } from '@linaria/react';

    export const Title = styled('h1')\`
      font-size: ${'${props => props.size}px'};
    \`;

    export const Body = atomicStyled('h1')\`
      font-size: ${'${props => props.size}px'};
    \`;
`,
      [
        evaluator,
        {
          variableNameSlug: [
            'componentName',
            'componentSlug',
            'processor',
            'valueSlug',
            'index',
          ]
            .map((s) => `[${s}]`)
            .join('_'),
        },
      ]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('removes fake replacement patterns in string classNameSlug', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { styled } from '@linaria/react';

    export const Title = styled('h1')\`
      font-size: 14px;
    \`;
`,
      [
        evaluator,
        {
          classNameSlug: '[not]_[actual]_[replacements]',
        },
      ]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('handles fn passed in classNameSlug', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { styled } from '@linaria/react';

    export const Title = styled('h1')\`
      font-size: 14px;
    \`;
`,
      [
        evaluator,
        {
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
        },
      ]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('handles fn passed in variableNameSlug', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { styled as atomicStyled } from '@linaria/atomic';
    import { styled } from '@linaria/react';

    export const Title = styled('h1')\`
      font-size: ${'${props => props.size}px'};
    \`;

    export const Body = atomicStyled('h1')\`
      font-size: ${'${props => props.size}px'};
    \`;
`,
      [
        evaluator,
        {
          variableNameSlug: (context) =>
            `${context.valueSlug}__${context.componentName}__${
              context.precedingCss.match(/([\w-]+)\s*:\s*$/)?.[1] ?? 'unknown'
            }`,
        },
      ]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('handles val in variableNameConfig', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { styled as atomicStyled } from '@linaria/atomic';
    import { styled } from '@linaria/react';

    export const Title = styled('h1')\`
      font-size: ${'${props => props.size}px'};
    \`;

    export const Body = atomicStyled('h1')\`
      font-size: ${'${props => props.size}px'};
    \`;
`,
      [
        evaluator,
        {
          variableNameConfig: 'var',
        },
      ]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('handles dashes in variableNameConfig', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { styled as atomicStyled } from '@linaria/atomic';
    import { styled } from '@linaria/react';

    export const Title = styled('h1')\`
      font-size: ${'${props => props.size}px'};
    \`;

    export const Body = atomicStyled('h1')\`
      font-size: ${'${props => props.size}px'};
    \`;
`,
      [
        evaluator,
        {
          variableNameConfig: 'dashes',
        },
      ]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('handles raw in variableNameConfig', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { styled as atomicStyled } from '@linaria/atomic';
    import { styled } from '@linaria/react';

    export const Title = styled('h1')\`
      font-size: ${'${props => props.size}px'};
    \`;

    export const Body = atomicStyled('h1')\`
      font-size: ${'${props => props.size}px'};
    \`;
`,
      [
        evaluator,
        {
          variableNameConfig: 'raw',
        },
      ]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('transpiles styled template literal with function and tag', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { styled } from '@linaria/react';

    export const Title = styled('h1')\`
      font-size: 14px;
    \`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('transpiles renamed styled import', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { styled as custom } from '@linaria/react';

    export const Title = custom('h1')\`
      font-size: 14px;
    \`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('transpiles renamed css and atomic-css imports in the same file', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('transpiles renamed styled and atomic-styled imports in the same file', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('transpiles renamed css from linaria v2', async () => {
    const { code, metadata } = await transform(
      dedent`
    import {css as coreCss} from 'linaria';

    const x = coreCss\`
      background: red;
    \`;

    console.log(x);
      `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('transpiles styled template literal with function and component', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { styled } from '@linaria/react';
    const Heading = () => null;

    export const Title = styled(Heading)\`
      font-size: 14px;
    \`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('transpiles styled template literal with TS component', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { styled } from '@linaria/react';

    type Props = { className?: string; children?: React.ReactNode };

    export const Title = styled((props: Props) => null)\`
      font-size: 14px;
    \`;
    `,
      [
        evaluator,
        {
          evaluate: false,
        },
        'ts',
      ]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('transpiles with typed fn as interpolated value', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { styled } from '@linaria/react';

    type Props = { className?: string; children?: React.ReactNode };

    export const Title = styled.div\`
      font-size: 14px;
      content: "${'${(props: Props) => props.className}'}"
    \`;
    `,
      [
        evaluator,
        {
          evaluate: false,
        },
        'ts',
      ]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('outputs valid CSS classname', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { styled } from '@linaria/react';

    export const ΩPage$Title = styled.h1\`
      font-size: 14px;
    \`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates nested nested object interpolation', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('keeps cx import and removes css', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { css, cx } from '@linaria/core';

    const defaultStyle = css\`
      color: red;
    \`;

    export const combined = cx(defaultStyle, Math.random() > 0.5 ? 'green' : 'red');
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates and inlines expressions in scope', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { styled } from '@linaria/react';

    const color = 'blue';

    export const Title = styled.h1\`
      color: ${'${color}'};
      width: ${'${100 / 3}'}%;
    \`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('inlines object styles as CSS string', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('inlines array styles as CSS string', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('handles interpolation followed by unit', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('handles interpolation in css function followed by unit', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { styled } from '@linaria/atomic';

    const size = 200;

    export const Container = styled.div\`
      transform: rotate(${'${props => props.$rotateDeg}'}deg);
      width: ${'${size}'}px;
    \`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('uses the same custom property for the same identifier', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { styled } from '@linaria/react';

    const size = () => 100;

    export const Box = styled.div\`
      height: ${'${size}'}px;
      width: ${'${size}'}px;
    \`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('uses the same custom property for the same expression', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { styled } from '@linaria/react';

    export const Box = styled.div\`
      height: ${'${props => props.size}'}px;
      width: ${'${props => props.size}'}px;
    \`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('do not include in dependencies expressions from interpolation functions bodies', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { styled } from '@linaria/react';
    import constant from './broken-dependency-1';
    import modifier from './broken-dependency-2';

    export const Box = styled.div\`
      height: ${'${props => props.size + constant}'}px;
      width: ${'${props => modifier(props.size)}'}px;
    \`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('handles nested blocks', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('prevents class name collision', async () => {
    const { code, metadata } = await transform(
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
      [evaluator, {}, 'jsx']
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('does not output CSS if none present', async () => {
    const { code, metadata } = await transform(
      dedent`
      const number = 42;

      const title = String.raw\`This is something\`;
      `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('does not output CSS property when value is a blank string', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { css } from '@linaria/core';

    export const title = css\`
      font-size: ${''};
      margin: 6px;
    \`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('transpiles css template literal', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { css } from '@linaria/core';

    export const title = css\`
      font-size: 14px;
    \`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('handles css template literal in object property', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { css } from '@linaria/core';

    const components = {
      title: css\`
        font-size: 14px;
      \`
    };
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('handles css template literal in JSX element', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { css } from '@linaria/core';

    <Title class={css\` font-size: 14px; \`} />
    `,
      [evaluator, {}, 'jsx']
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('throws when contains unsupported expression', async () => {
    expect.assertions(1);

    try {
      await transform(
        dedent`
      import { css } from '@linaria/core';

      const size = 100;

      const title = css\`
        font-size: ${'${() => size}'}px;
      \`;
      `,
        [evaluator]
      );
    } catch (e) {
      expect(
        stripAnsi(
          (e as { message: string }).message.replace(
            dirName + sep,
            '<<DIRNAME>>/'
          )
        )
      ).toMatchSnapshot();
    }
  });

  it('supports both css and styled tags', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('does not include styles if not referenced anywhere', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('includes unreferenced styles for :global', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('handles objects with numeric keys', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { css } from '@linaria/core';

      export const object = {
        stringKey: css\`\`,
        42: css\`\`,
      }
      `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('handles objects with enums as keys', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { css } from '@linaria/core';
      import { TestEnum } from './__fixtures__/ts-data.ts';

      export const object = {
        [TestEnum.FirstValue]: css\`\`,
        [TestEnum.SecondValue]: css\`\`,
      }
      `,
      [evaluator, {}, 'ts']
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('compiles atomic css', async () => {
    const { code, metadata } = await transform(
      dedent`
    /* @flow */

    import { css } from '@linaria/atomic';

    const x = css\`
      background: red;
      height: 100px;
    \`;

    console.log(x);

      `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('compiles atomic css with property priorities', async () => {
    const { code, metadata } = await transform(
      dedent`
    /* @flow */

    import { css } from '@linaria/atomic';

    const y = css\`
      margin-left: 5px;
    \`;

    const x = css\`
      margin: 0;
    \`;

    console.log(x, y);

      `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('compiles atomic css with at-rules and pseudo classes', async () => {
    const { code, metadata } = await transform(
      dedent`
    /* @flow */

    import { css } from '@linaria/atomic';

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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('compiles atomic css with at-rules and property priorities', async () => {
    const { code, metadata } = await transform(
      dedent`
    /* @flow */

    import { css } from '@linaria/atomic';

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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('compiles css with keyframes', async () => {
    const { code, metadata } = await transform(
      dedent`
    import { css } from '@linaria/core';

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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('compiles atomic css with keyframes', async () => {
    const { code, metadata } = await transform(
      dedent`
    /* @flow */

    import { css } from '@linaria/atomic';

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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('compiles atomic styled with static css', async () => {
    const { code, metadata } = await transform(
      dedent`
    /* @flow */

    import { styled } from '@linaria/atomic';

    const Component = styled.div\`
      color: blue;
      height: 100px;
    \`;

    console.log(Component);

      `,
      [evaluator]
    );
    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('compiles atomic css with unique atoms based on key value pairs', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('compiles atomic styled with plain css, static and dynamic interpolations', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );
    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('compiles atoms that are shared between css and styled templates', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );
    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('compiles atomic styled wrapping other components with extra priority', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );
    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('compiles atomic styled without colliding by property', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );
    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('compiles atomic styled with dynamic interpolations as unique variables based on the interpolation text', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );
    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates identifier in scope', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );
    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('hoistable identifiers', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('non-hoistable identifiers', async () => {
    expect.assertions(1);

    try {
      await transform(
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
        [evaluator]
      );
    } catch (e) {
      expect(
        stripAnsi(
          (e as { message: string }).message.replace(
            dirName + sep,
            '<<DIRNAME>>/'
          )
        )
      ).toMatchSnapshot();
    }
  });

  it('evaluates imported typescript enums', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { styled } from '@linaria/react';
      import { Colors } from './__fixtures__/enums';

      export const Title = styled.h1\`
        color: ${'${Colors.BLUE}'};
      \`;
      `,
      [evaluator, {}, 'ts']
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates local expressions', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates functions with nested identifiers', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates expressions with dependencies', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { styled } from '@linaria/react';
      import slugify from './__fixtures__/slugify';

      export const Title = styled.h1\`
        &:before {
          content: "${"${slugify('test')}"}"
        }
      \`;
      `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates expressions with expressions depending on shared dependency', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates multiple expressions with shared dependency', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates interpolations with sequence expression', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { styled } from '@linaria/react';
      let external = 0;
      export const Title = styled.h1\`
        color: ${'${(external, () => "blue")}'};
      \`;
      `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates dependencies with sequence expression', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { styled } from '@linaria/react';
      let external = 0;
      const color = (external, () => 'blue');

      export const Title = styled.h1\`
        color: ${'${color}'};
      \`;
      `,
      [evaluator]
    );
    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates component interpolations', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('throws when interpolation evaluates to undefined', async () => {
    expect.assertions(1);

    try {
      await transform(
        dedent`
        const { styled } = require('@linaria/react');

        let fontSize;

        export const Title = styled.h1\`
          font-size: ${'${fontSize}'};
        \`;
        `,
        [evaluator]
      );
    } catch (e) {
      expect(
        stripAnsi(
          (e as { message: string }).message.replace(
            dirName + sep,
            '<<DIRNAME>>/'
          )
        )
      ).toMatchSnapshot();
    }
  });

  it('throws when interpolation evaluates to null', async () => {
    expect.assertions(1);

    try {
      await transform(
        dedent`
        const { styled } = require('@linaria/react');

        const color = null;

        export const Title = styled.h1\`
          color: ${'${color}'};
        \`;
        `,
        [evaluator]
      );
    } catch (e) {
      expect(
        stripAnsi(
          (e as { message: string }).message.replace(
            dirName + sep,
            '<<DIRNAME>>/'
          )
        )
      ).toMatchSnapshot();
    }
  });

  it('throws when interpolation evaluates to NaN', async () => {
    expect.assertions(1);

    try {
      await transform(
        dedent`
        const { styled } = require('@linaria/react');

        const height = NaN;

        export const Title = styled.h1\`
          height: ${'${height}'}px;
        \`;
        `,
        [evaluator]
      );
    } catch (e) {
      expect(
        stripAnsi(
          (e as { message: string }).message.replace(
            dirName + sep,
            '<<DIRNAME>>/'
          )
        )
      ).toMatchSnapshot();
    }
  });

  it('handles wrapping another styled component', async () => {
    const { code, metadata } = await transform(
      dedent`
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
      [evaluator]
    );
    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('handles indirect wrapping another styled component', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('inlines object styles as CSS string', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('inlines array styles as CSS string', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('ignores inline arrow function expressions', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { styled } from '@linaria/react';

      export const Title = styled.h1\`
        &:before {
          content: "${'${props => props.content}'}"
        }
      \`;
      `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('simplifies react components', async () => {
    const div = '<div>{props.children + constant}</div>';
    const { code, metadata } = await transform(
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

      const ComplexFunctionComponent = (props) => {
        if (import.meta.env.PROD) {
          return ${div};
        }

        return null;
      }

      export const StyledFunc = styled(FuncComponent)\`
        color: red;
      \`;
      export const StyledClass = styled(ClassComponent)\`
        color: blue;
      \`;
      `,
      [evaluator, {}, 'jsx']
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('simplifies transpiled react components', async () => {
    const { code, metadata } = await transform(
      dedent`
      import * as ReactNS from 'react';
      import React from 'react';
      import { createElement } from 'react';
      import { styled } from '@linaria/react';
      import constant from './broken-dependency';

      const A = () => ReactNS.createElement('div', {}, constant);

      const B = () => createElement(A, {}, constant);

      const C = () => React.createElement(FuncComponent, {}, constant);

      export const D = styled(C)\`
        color: red;
      \`;
      `,
      [evaluator, {}, 'jsx']
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('simplifies transpiled react components CJS', async () => {
    const { code, metadata } = await transform(
      dedent`
      var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
      var React = _interopRequireWildcard(require("react"));
      var styled = require('@linaria/react').styled;
      var constant = require('./broken-dependency').default;

      const A = () => React.createElement('div', {}, constant);

      const B = () => React.createElement(A, {}, constant);

      const C = () => React.createElement(FuncComponent, {}, constant);

      exports.D = styled(C)\`
        color: red;
      \`;
      `,
      [evaluator, {}, 'jsx']
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('ignores inline vanilla function expressions', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { styled } from '@linaria/react';

      export const Title = styled.h1\`
        &:before {
          content: "${'${function(props) { return props.content }}'}"
        }
      \`;
      `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('ignores external expressions', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { styled } from '@linaria/react';

      const generate = props => props.content;

      export const Title = styled.h1\`
        &:before {
          content: "${'${generate}'}"
        }
      \`;
      `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('throws codeframe error when evaluation fails', async () => {
    expect.assertions(1);

    try {
      await transform(
        dedent`
        import { styled } from '@linaria/react';

        const foo = props => { throw new Error('This will fail') };

        export const Title = styled.h1\`
          font-size: ${'${foo()}'}px;
        \`;
        `,
        [evaluator]
      );
    } catch (e) {
      expect(
        stripAnsi(
          (e as { message: string }).message.replace(
            dirName + sep,
            '<<DIRNAME>>/'
          )
        )
      ).toMatchSnapshot();
    }
  });

  it('generates stable class names', async () => {
    const { code, metadata } = await transformFile(
      resolve(__dirname, './__fixtures__/components-library.js'),
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('derives display name from filename', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { styled } from '@linaria/react';

      export default styled.h1\`
        font-size: 14px;
      \`;
      `,
      [evaluator, {}, 'js', join(dirName, 'FancyName.js')]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('derives display name from parent folder name', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { styled } from '@linaria/react';

      export default styled.h1\`
        font-size: 14px;
      \`;
      `,
      [evaluator, {}, 'js', join(dirName, 'FancyName/index.js')]
    )!;

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it("throws if couldn't determine a display name", async () => {
    expect.assertions(1);

    try {
      await transform(
        dedent`
        import { styled } from '@linaria/react';

        export default styled.h1\`
          font-size: 14px;
        \`;
        `,
        [
          evaluator,
          {
            extensions: [''],
          },
          'js',
          join(dirName, '/.js'),
        ]
      );
    } catch (e) {
      expect(
        stripAnsi(
          (e as { message: string }).message.replace(
            dirName + sep,
            '<<DIRNAME>>/'
          )
        )
      ).toMatchSnapshot();
    }
  });

  it('does not strip istanbul coverage sequences', async () => {
    const cwd =
      process.platform === 'win32'
        ? 'C:\\Users\\project'
        : '/home/user/project';
    const withIstanbul = await babel.transformAsync(
      dedent`
      import { css } from './custom-css-tag';
      const a = 42;

      export const titleClass = css\`
        height: ${'${a}'}px;
      \`;
      `,
      {
        cwd,
        filename: 'file.js',
        plugins: [
          [
            // eslint-disable-next-line import/no-extraneous-dependencies
            require('babel-plugin-istanbul').default({
              ...babel,
              assertVersion: () => {},
            }),
            { cwd },
          ],
        ],
      }
    );

    if (!withIstanbul?.code) {
      return;
    }

    const { code, metadata } = await transform(withIstanbul.code, [
      evaluator,
      {
        tagResolver: (source, tag) => {
          if (source === './custom-css-tag' && tag === 'css') {
            return require.resolve('@linaria/core/processors/css');
          }

          return null;
        },
      },
    ]);

    // The output is different on Windows & POSIX-like system
    const normalizedCode = code
      .replace(/(cov_)\w+([\s(])/g, `$1__HASH__$2`)
      .replace(/(hash\s?[:=]\s")\w+(")/g, `$1__HASH__$2`)
      .replace(/(path\s?[:=]\s")[\w:\\/.]+(")/g, `$1__PATH__$2`);

    expect(normalizedCode).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  // PR #524
  it('should work with String and Number object', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { css } from '@linaria/core';

      export const style = css\`
        width: ${'${new String("100%")}'};
        opacity: ${'${new Number(0.75)}'};
      \`;
      `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should work with generated classnames as selectors', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { css } from "@linaria/core";

      export const text = css\`\`;

      export const square = css\`
        .${'${text}'} {
          color: red;
        }
      \`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should process `css` calls inside components', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should process `styled` calls inside components', async () => {
    const { code, metadata } = await transform(
      dedent`
      import React from 'react'
      import { styled } from '@linaria/react'

      export function Component() {
        const opacity = 0.2;
        const MyComponent = styled.h1\`
          opacity: ${'${opacity}'};
        \`;

        return React.createElement(MyComponent);
      }
      `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should process `css` calls with complex interpolation inside components', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should process `css` calls referencing other `css` calls inside components', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should process `styled` calls with complex interpolation inside components', async () => {
    const { code, metadata } = await transform(
      dedent`
        import React from 'react'
        import {css} from '@linaria/core'
        import {styled} from '@linaria/react'

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

          const MyComponent = styled.h1\`
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should handle shadowed identifier inside components', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('it should not throw location error for hoisted identifier', async () => {
    const { code, metadata } = await transform(
      dedent`
        import React from 'react'
        import {css} from '@linaria/core'

        const size = () => 5
        export default function Component() {
          const color = size()
          return css\`opacity:${'${color}'};\`
        }
        `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should wrap memoized components', async () => {
    const { code, metadata } = await transform(
      dedent`
        import React from 'react';
        import { styled } from '@linaria/react';

        const MyComponent = React.memo(() => <div />);

        export default styled(MyComponent)\`
          color: red;
        \`
        `,
      [evaluator, {}, 'jsx']
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('handles escapes properly', async () => {
    const { code, metadata } = await transformFile(
      resolve(__dirname, './__fixtures__/escape-character.js'),
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates babel helpers', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('uses values from json', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { css } from '@linaria/core';
      import sample from './__fixtures__/sample-data.json';

      export const eyeColorClass = css\`
        color: ${'${sample.eye_color}'};
      \`;
      `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates complex styles with functions and nested selectors', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should work with wildcard imports', async () => {
    const { code, metadata } = await transform(
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
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('assigning to exports', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { css } from "@linaria/core";
      import { Padding } from "./__fixtures__/assignToExport";

      export const square = css\`
        div {
          padding: ${'${Padding}'}px;
        }
      \`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('exporting objects', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { css } from "@linaria/core";
      import object from "./__fixtures__/objectExport";

      export const square = css\`
        div {
          margin: ${'${object.margin}'}px;
        }
      \`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('exporting objects with computed keys', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { css } from "@linaria/core";
      import { object } from "./__fixtures__/computedKeys";

      export const square = css\`
        div {
          color: ${'${object.blue}'};
        }
      \`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('exporting sequence expressions', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { css } from "@linaria/core";
      import number from "./__fixtures__/sequenceExport";

      export const square = css\`
        div {
          height: ${'${number}'}px;
        }
      \`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should work with wildcard reexports', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { css } from "@linaria/core";
      import { foo1 } from "./__fixtures__/reexports";

      export const square = css\`
        color: ${'${foo1}'};
      \`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should ignore unused wildcard reexports', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { css } from "@linaria/core";
      import { foo1 } from "./__fixtures__/reexports";

      export const square = css\`
        color: ${'${foo1}'};
      \`;
    `,
      [evaluator],
      undefined,
      emitter
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();

    const reexports = resolve(__dirname, './__fixtures__/reexports.js');
    const unusedFile = resolve(__dirname, './__fixtures__/bar.js');
    expect(onEntrypointEvent).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ filename: reexports, type: 'created' })
    );

    hasNotBeenProcessed(unusedFile);
  });

  it('should not drop exported vars of renamed imports', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { css } from "@linaria/core";
      import { foo3 } from "./__fixtures__/reexports";

      export const bar3 = foo3;

      export const square = css\`
        color: ${'${bar3("thing")}'};
      \`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should process unary expressions in interpolation', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { css } from "@linaria/core";

      let size = 1337;
      size += 0;

      export const class1 = css\`width:${'${+size}'}px;\`;
      export const class2 = css\`width:${'${size}'}px;\`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  xit('should process bindings in interpolation', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { css } from "@linaria/core";

      let size = 1337;

      export const class1 = css\`width:${'${size = 1}'}px;\`;
      export const class2 = css\`width:${'${size}'}px;\`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should interpolate imported components', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { css } from "@linaria/core";
      import { Title } from "./__fixtures__/complex-component";

      export const square = css\`
        ${'${Title}'} {
          color: red;
        }
      \`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should interpolate imported variables', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { css } from "@linaria/core";
      import { whiteColor } from "./__fixtures__/complex-component";

      export const square = css\`
        color: ${'${whiteColor}'}
      \`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates typescript enums', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { styled } from '@linaria/react';

      enum Colors {
        BLUE = '#27509A'
      }

      export const Title = styled.h1\`
        color: ${'${Colors.BLUE}'};
      \`;
      `,
      [evaluator, {}, 'ts']
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('understands satisfies keyword', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { css } from "@linaria/core"

      interface ColorTokenMap {
        primary: string
        secondary: string
      }

      const lightTokens = {
        primary: "#111",
        secondary: "#09f",
      } satisfies ColorTokenMap

      export const text = css\`
        color: ${'${lightTokens.primary}'};
      \`;
      `,
      [evaluator, {}, 'ts']
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should process circular imports', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { styled } from '@linaria/react';
      import { fooStyles } from "./__fixtures__/circular-imports";

      const value = fooStyles.constBar;

      export const H1 = styled.h1\`
        color: ${'${value}'};
      \`
      `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('evaluates chain of reexports', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { styled } from '@linaria/react';
      import { fooStyles } from "./__fixtures__/re-exports";

      const value = fooStyles.foo;

      export const H1 = styled.h1\`
        color: ${'${value}'};
      \`
      `,
      [evaluator],
      undefined,
      emitter
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();

    hasNotBeenProcessed(resolve(__dirname, './__fixtures__/bar.js'));
    hasNotBeenProcessed(
      resolve(__dirname, './__fixtures__/re-exports/empty.js')
    );
  });

  it('should fail because babelrc options is disabled', async () => {
    const fn = () =>
      transformFile(
        resolve(__dirname, './__fixtures__/with-babelrc/index.js'),
        [
          evaluator,
          {
            features: {
              useBabelConfigs: false,
            },
          },
        ]
      );

    expect(fn).rejects.toThrowError(`Cannot find module '_/re-exports'`);
  });

  it('respects module-resolver plugin and show waring', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { code, metadata } = await transformFile(
      resolve(__dirname, './__fixtures__/with-babelrc/index.js'),
      [evaluator]
    );

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'This works for now but will be an error in the future'
      )
    );
    warn.mockRestore();
    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it("respects module-resolver plugin and don't show waring", async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { code, metadata } = await transformFile(
      resolve(__dirname, './__fixtures__/with-babelrc/index.js'),
      [
        evaluator,
        {
          babelOptions: {
            plugins: [
              [
                'module-resolver',
                {
                  alias: {
                    _: './src/__fixtures__',
                  },
                },
              ],
            ],
          },
        },
      ]
    );

    expect(warn).toHaveBeenCalledTimes(0);
    warn.mockRestore();
    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('handles complex component', async () => {
    const { code, metadata } = await transformFile(
      resolve(__dirname, './__fixtures__/complex-component.js'),
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should process griffel makeStyles', async () => {
    const { code, metadata } = await transform(
      dedent`
        import { makeStyles } from '@linaria/griffel';

        export const useStyles = makeStyles({
          root: {
            display: 'flex',

            ':hover': { color: 'red' },
            ':focus': { ':hover': { color: 'blue' } },

            '& .foo': { ':hover': { color: 'green' } },
          },
        });
      `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should eval component from a linaria library', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { styled } from "@linaria/react";
      import { Title } from "./__fixtures__/linaria-ui-library/components/index";

      export const StyledTitle = styled(Title)\`\`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should not eval components from a non-linaria library', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { styled } from "@linaria/react";
      import { Title } from "./__fixtures__/non-linaria-ui-library/index";

      export const StyledTitle = styled(Title)\`\`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should not eval non-linaria component from a linaria library', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { styled } from "@linaria/react";
      import { Title } from "./__fixtures__/linaria-ui-library/non-linaria-components";

      export const StyledTitle = styled(Title)\`\`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should eval wrapped component from a linaria library', async () => {
    const { code, metadata } = await transform(
      dedent`
      import { styled } from "@linaria/react";
      import { connect } from "./__fixtures__/linaria-ui-library/hocs";
      import { Title } from "./__fixtures__/linaria-ui-library/components/index";

      export const StyledTitle = styled(connect(Title))\`\`;
    `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should not eval wrapped component from a non-linaria library', async () => {
    const { code, metadata } = await transform(
      dedent`
        import { styled } from "@linaria/react";
        import { connect } from "./__fixtures__/linaria-ui-library/hocs";
        import { Title } from "./__fixtures__/non-linaria-ui-library/index";

        export const StyledTitle = styled(connect(Title))\`\`;
      `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should not import types', async () => {
    const { code, metadata } = await transform(
      dedent`
        import { styled } from "@linaria/react";
        import { Title } from "./__fixtures__/linaria-ui-library/components/index";
        import { ComponentType } from "./__fixtures__/linaria-ui-library/types";

        const map = new Map<string, ComponentType>()
          .set('Title', Title);

        const Gate = (props: { type: ComponentType, className: string }) => {
          const { className, type } = props;
          const Component = map.get(type);
          return <Component className={className}/>;
        };

        export const StyledTitle = styled(Gate)\`\`;
      `,
      [evaluator, {}, 'tsx']
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should shake out identifiers that are referenced only in types', async () => {
    const { code, metadata } = await transform(
      dedent`
        import { styled } from "@linaria/react";
        import * as yup from "yup";
        import { Form } from "./__fixtures__/linaria-ui-library/components/index";

        const validationSchema = yup.object();
        type IModel = yup.InferType<typeof validationSchema>;

        const Editor = () => {
          const initial: IModel = {};
          return <Form schema={validationSchema} data={initial} />;
        };

        export const StyledEditor = styled(Editor)\`\`;
      `,
      [evaluator, {}, 'tsx']
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should process dynamic require', async () => {
    const { code, metadata } = await transform(
      dedent`
        import { css } from "@linaria/core";

        const url = "./__fixtures__/FOO";
        const foo2 = require(url.toLowerCase()).foo2;

        export const square = css\`
          div:before {
            content: ${'${foo2}'};
          }
        \`;
      `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should work with built-in modules', async () => {
    const { code, metadata } = await transform(
      dedent`
        import { css } from "@linaria/core";
        import { URL } from "url";

        const url = (new URL("https://example.com")).toString();

        export const square = css\`
          background: url(${'${url}'});
        \`;
      `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should process module.exports = require(…)', async () => {
    const { code, metadata } = await transform(
      dedent`
        import { css } from "@linaria/core";

        const mod = require("./__fixtures__/module-reexport");

        export const square = css\`
          div:before {
            content: ${'${mod.foo}'};
          }
        \`;
      `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should import react as namespace', async () => {
    const { code, metadata } = await transform(
      dedent`
        import { styled } from "@linaria/react";
        import * as React from "react";

        const Cmp = React.memo(() => null);

        export const StyledTitle = styled(Cmp)\`\`;
      `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  it('should work with short-circuit imports', async () => {
    const { code, metadata } = await transform(
      dedent`
        import { css } from "@linaria/core";
        import { stringConstant } from "./__fixtures__/self-import";

        export const StyledTitle = css\`
          content: "${'${stringConstant}'}";
        \`;
      `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  xit('should shake out side effect because its definition uses DOM API', async () => {
    const { code, metadata } = await transform(
      dedent`
        import { css } from "@linaria/core";
        import { runNearFramePaint } from "./__fixtures__/runNearFramePaint";

        runNearFramePaint(() => {
          // Do something
        });

        export const text = css\`\`;
      `,
      [evaluator]
    );

    expect(code).toMatchSnapshot();
    expect(metadata).toMatchSnapshot();
  });

  describe('cache', () => {
    const getCachedExports = (
      cache: TransformCacheCollection,
      filename: string
    ) => {
      const cachedFoo = cache.get('entrypoints', filename);
      if (!cachedFoo?.evaluated) {
        throw new Error('Expected entrypoint to be evaluated');
      }

      const result: Record<string | symbol, unknown> = {};
      Object.keys(cachedFoo.exports).forEach((key) => {
        result[key] = cachedFoo.exports[key];
      });

      return result;
    };

    it('should cache evaluation', async () => {
      const filename = require.resolve(join(dirName, './__fixtures__/foo'));
      const cache = new TransformCacheCollection();
      const { code, metadata } = await transform(
        dedent`
          import { css } from "@linaria/core";
          import { foo1, foo2 } from "./__fixtures__/foo";

          export const text = css\`font-size: ${'${foo1}'}\`;
          `,
        [evaluator],
        cache
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();

      const exports = getCachedExports(cache, filename);
      expect(exports.foo1).toBe('foo1');
      expect(exports.foo2).toBe(undefined); // foo2 is not used and should not be evaluated
    });

    const createCacheFor = async (
      filename: string,
      exports: Record<string, string>
    ) => {
      const fooContent = readFileSync(filename, 'utf-8');
      const cache = new TransformCacheCollection();
      cache.invalidateIfChanged(filename, fooContent);

      const only = Object.keys(exports);
      const exportsProxy = Entrypoint.createExports(linariaLogger);
      only.forEach((key) => {
        exportsProxy[key] = exports[key];
      });

      cache.add('entrypoints', filename, {
        evaluated: true,
        evaluatedOnly: only,
        generation: 1,
        exports: exportsProxy,
        ignored: false,
        log: linariaLogger,
        only,
      });

      return cache;
    };

    it('should use cached value', async () => {
      const filename = require.resolve(join(dirName, './__fixtures__/foo'));
      const cache = await createCacheFor(filename, { foo1: 'cached-foo1' });

      const { code, metadata } = await transform(
        dedent`
          import { css } from "@linaria/core";
          import { foo1 } from "./__fixtures__/foo";

          export const text = css\`font-size: ${'${foo1}'}\`;
          `,
        [evaluator],
        cache
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('should use partially cached value', async () => {
      const filename = require.resolve(join(dirName, './__fixtures__/foo'));
      const cache = await createCacheFor(filename, { foo1: 'cached-foo1' });

      const { code, metadata } = await transform(
        dedent`
          import { css } from "@linaria/core";
          import { foo1, foo2 } from "./__fixtures__/foo";

          export const text = css\`font-size: ${'${foo1 + foo2}'}\`;
          `,
        [evaluator],
        cache
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    // it('should use cached value even if only part of it is required', async () => {
    it('should use cached value even if only part is required', async () => {
      const filename = require.resolve(join(dirName, './__fixtures__/foo'));
      const cache = await createCacheFor(filename, {
        foo1: 'cached-foo1',
        foo2: 'cached-foo2',
      });

      const { code, metadata } = await transform(
        dedent`
          import { css } from "@linaria/core";
          import { foo1 } from "./__fixtures__/foo";

          export const text = css\`font-size: ${'${foo1}'}\`;
          `,
        [evaluator],
        cache
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });
  });

  describe('concurrent', () => {
    it('two parallel chains of reexports', async () => {
      const cache = new TransformCacheCollection();

      const files = {
        'source-1': dedent`
          import { styled } from '@linaria/react';
          import { fooStyles } from "./__fixtures__/re-exports";

          const value = fooStyles.foo;

          export const H1 = styled.h1\`
            color: ${'${value}'};
          \`
        `,
        'source-2': dedent`
          import { styled } from '@linaria/react';
          import { bar2 } from "./__fixtures__/re-exports";

          export const H1 = styled.h1\`
            color: ${'${bar2}'};
          \`
        `,
      };

      const results = await Promise.all(
        Object.entries(files).map(([filename, content]) =>
          transform(content, [evaluator], cache, emitter, filename)
        )
      );

      for (const { code, metadata } of results) {
        expect(code).toMatchSnapshot();
        expect(metadata).toMatchSnapshot();
      }

      hasNotBeenProcessed(
        resolve(__dirname, './__fixtures__/re-exports/empty.js')
      );
    });

    it('multiple parallel chains of reexports', async () => {
      const cache = new TransformCacheCollection();

      const tokens = ['foo', 'bar', 'bar1', 'bar2'];

      const results = await Promise.all(
        tokens.map((token) =>
          transform(
            dedent`
              import { styled } from '@linaria/react';
              import { ${token} } from "./__fixtures__/re-exports";

              export const H1${token} = styled.h1\`
                color: ${`\${${token}}`};
              \`
            `,
            [evaluator],
            cache,
            emitter,
            token
          )
        )
      );

      for (const { code, metadata } of results) {
        expect(code).toMatchSnapshot();
        expect(metadata).toMatchSnapshot();
      }
    });

    it('loop in evaluated files', async () => {
      const cache = new TransformCacheCollection();

      await expect(() =>
        Promise.all(
          ['AB', 'BA'].map((token) =>
            transform(
              dedent`
              import { styled } from '@linaria/react';
              import { ${token} } from "./__fixtures__/loop/${token.toLowerCase()}";

              export const H1${token} = styled.h1\`
                color: ${`\${${token}}`};
              \`
            `,
              [evaluator],
              cache,
              emitter,
              token
            )
          )
        )
      ).rejects.toThrowError(/reading 'toLowerCase'/);
    });
  });
});
