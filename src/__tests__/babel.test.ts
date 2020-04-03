import * as babel from '@babel/core';
import dedent from 'dedent';
import { join } from 'path';
import stripAnsi from 'strip-ansi';
import serializer from '../__utils__/linaria-snapshot-serializer';
import { StrictOptions } from '../babel/types';

expect.addSnapshotSerializer(serializer);

const transpile = async (
  input: string,
  opts: Partial<StrictOptions> = { evaluate: false }
) =>
  (await babel.transformAsync(input, {
    babelrc: false,
    presets: [[require.resolve('../babel'), opts]],
    plugins: ['@babel/plugin-syntax-jsx'],
    filename: join(__dirname, 'app/index.js'),
    configFile: false,
  }))!;

it('transpiles styled template literal with object', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from 'linaria/react';

    export const Title = styled.h1\`
      font-size: 14px;
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('uses string passed in as classNameSlug', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from 'linaria/react';

    export const Title = styled('h1')\`
      font-size: 14px;
    \`;
`,
    { classNameSlug: 'testSlug' }
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('handles fn passed in as classNameSlug', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from 'linaria/react';

    export const Title = styled('h1')\`
      font-size: 14px;
    \`;
`,
    {
      classNameSlug: (hash, title) => {
        return `${hash}_${7 * 6}_${title}`;
      },
    }
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('transpiles styled template literal with function and tag', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from 'linaria/react';

    export const Title = styled('h1')\`
      font-size: 14px;
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('transpiles renamed styled import', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled as custom } from 'linaria/react';

    export const Title = custom('h1')\`
      font-size: 14px;
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('transpiles styled template literal with function and component', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from 'linaria/react';
    const Heading = () => null;

    export const Title = styled(Heading)\`
      font-size: 14px;
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('outputs valid CSS classname', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from 'linaria/react';

    export const ᾩPage$Title = styled.h1\`
      font-size: 14px;
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('evaluates and inlines expressions in scope', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from 'linaria/react';

    const color = 'blue';

    export const Title = styled.h1\`
      color: ${'${color}'};
      width: ${'${100 / 3}'}%;
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

    const cover = {
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
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('inlines array styles as CSS string', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from 'linaria/react';

    const styles = [
      { flex: 1 },
      { display: 'block', height: 24 },
    ];

    export const Title = styled.h1\`
      ${'${styles}'}
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('replaces unknown expressions with CSS custom properties', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from 'linaria/react';

    export const Title = styled.h1\`
      font-size: ${'${size}'}px;
      color: ${'${props => props.color}'};
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('handles interpolation followed by unit', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from 'linaria/react';

    export const Title = styled.h1\`
      font-size: ${'${size}'}em;
      text-shadow: black 1px ${'${shadow}'}px, white -2px -2px;
      margin: ${'${size}'}px;
      width: calc(2 * ${'${props => props.width}'}vw);
      height: ${'${props => { if (true) { return props.height } else { return 200 } }}'}px;
      grid-template-columns: ${'${unit}'}fr 1fr 1fr ${'${unit}'}fr;
      border-radius: ${'${function(props) { return 200 }}'}px
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('uses the same custom property for the same identifier', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from 'linaria/react';

    export const Box = styled.div\`
      height: ${'${size}'}px;
      width: ${'${size}'}px;
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('uses the same custom property for the same expression', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from 'linaria/react';

    export const Box = styled.div\`
      height: ${'${props => props.size}'}px;
      width: ${'${props => props.size}'}px;
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('handles nested blocks', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from 'linaria/react';

    export const Button = styled.button\`
      font-family: ${'${regular}'};

      &:hover {
        border-color: blue;
      }

      @media (max-width: 200px) {
        width: 100%;
      }
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('prevents class name collision', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from 'linaria/react';

    export const Title = styled.h1\`
      font-size: ${'${size}'}px;
      color: ${'${props => props.color}'}
    \`;

    function Something() {
      const Title = styled.h1\`
        font-family: ${'${regular}'};
      \`;

      return <Title />;
    }
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('does not output CSS if none present', async () => {
  const { code, metadata } = await transpile(
    dedent`
      const number = 42;

      const title = String.raw\`This is something\`;
      `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('transpiles css template literal', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { css } from 'linaria';

    export const title = css\`
      font-size: 14px;
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('handles css template literal in object property', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { css } from 'linaria';

    const components = {
      title: css\`
        font-size: 14px;
      \`
    };
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('handles css template literal in JSX element', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { css } from 'linaria';

    <Title class={css\` font-size: 14px; \`} />
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('throws when contains dynamic expression without evaluate: true in css tag', async () => {
  expect.assertions(1);

  try {
    await transpile(
      dedent`
      import { css } from 'linaria';

      const title = css\`
        font-size: ${'${size}'}px;
      \`;
      `
    );
  } catch (e) {
    expect(
      stripAnsi(e.message.replace(__dirname, '<<DIRNAME>>'))
    ).toMatchSnapshot();
  }
});

it('supports both css and styled tags', async () => {
  const { code, metadata } = await transpile(
    dedent`
      import { css } from 'linaria';
      import { styled } from 'linaria/react';

      export const Title = styled.h1\`
        font-size: 14px;
      \`;

      export const title = css\`
        color: blue;
      \`;
      `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('does not include styles if not referenced anywhere', async () => {
  const { code, metadata } = await transpile(
    dedent`
      import { css } from 'linaria';
      import { styled } from 'linaria/react';

      const Title = styled.h1\`
        font-size: 14px;
      \`;

      const title = css\`
        color: blue;
      \`;
      `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('includes unreferenced styles for :global', async () => {
  const { code, metadata } = await transpile(
    dedent`
      import { css } from 'linaria';
      import { styled } from 'linaria/react';

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
      `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});
