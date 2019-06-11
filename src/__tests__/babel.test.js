/* eslint-disable no-template-curly-in-string */
/* @flow */

const path = require('path');
const babel = require('@babel/core');
const dedent = require('dedent');
const stripAnsi = require('strip-ansi');
const serializer = require('../__utils__/linaria-snapshot-serializer');

expect.addSnapshotSerializer(serializer);

const transpile = input =>
  babel.transformAsync(input, {
    babelrc: false,
    presets: [[require.resolve('../babel'), { evaluate: false }]],
    plugins: ['@babel/plugin-syntax-jsx'],
    filename: path.join(__dirname, 'app/index.js'),
  });

it('transpiles styled template literal with object', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from 'linaria/react';

    export const Title = props => styled.h1\`
      font-size: 14px;
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('handles basic properties', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from 'linaria/react';

    export const Title = props => styled.h1\`
      font-size: ${'${props.size}'}px;
    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('handles variant classes', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from 'linaria/react';

    export const Button = props => styled.button\`
      background: ${'${props.color}'};
      padding: 16px 24px;
      transition: 200ms;
      font-size: 24px;
      &:hover {
        color: ${'${props.color}'};
        background: white;
      }


    \`;
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('handles modifier condition selector', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from 'linaria/react';

    export const Button = props => styled.button\`
      background: ${'${props.color}'};
      padding: 16px 24px;
      color: ${"${'red'}"};
      transition: 200ms;
      font-size: 24px;
      &:hover {
        color: ${'${props.color}'};
        background: white;
      }

      &.${'${[props.primary]}'} {
        border-radius: 30px;
        background: #18b09d;
        color: white;
        &:hover {
          background: #087b6d;
        }
      }
    \`;
    `
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

it('throws when array attribute is not in root scope', async () => {
  expect.assertions(1);

  try {
    await transpile(
      dedent`
      import { styled } from 'linaria/react';
      const size = 18;

      export const Array = props => styled.div\`
        &:hover {
          &.${'${[props.primary, 1]}'} {
            color: blue;
          }
          font-size: ${'${size}'}px;
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

it('throws if state selector is nested', async () => {
  expect.assertions(1);
  try {
    await transpile(
      dedent`
      import { styled } from 'linaria/react';

      const Page = props => styled.div\`
        color: #fff;
        &.${'${[props.primary]}'} {
          color: #241047;
          /* This should not work */
          body &.${'${[props.input === "I agree"]}'} {
            text-shadow: 9px 9px 9px rgba(0, 255, 0, 0.28);
          }
        }
      \`
      `
    );
  } catch (e) {
    expect(
      stripAnsi(e.message.replace(__dirname, '<<DIRNAME>>'))
    ).toMatchSnapshot();
  }
});

it('thows if state selector not not wrapped in arrow function', async () => {
  expect.assertions(1);
  try {
    await transpile(
      dedent`
      import { styled } from 'linaria/react';

      const Page = styled.div\`
        color: #fff;
        &.${'${[props.primary]}'} {
          color: #241047;
        }
      \`
      `
    );
  } catch (e) {
    expect(
      stripAnsi(e.message.replace(__dirname, '<<DIRNAME>>'))
    ).toMatchSnapshot();
  }
});

it('thows if alternative propName is used and an array attribute selector is not a function of it.', async () => {
  expect.assertions(1);
  try {
    await transpile(
      dedent`
      import { styled } from 'linaria/react';

      const Page = state => styled.div\`
        color: #fff;
        &.${'${[props.primary]}'} {
          color: #241047;
        }
      \`
      `
    );
  } catch (e) {
    expect(
      stripAnsi(e.message.replace(__dirname, '<<DIRNAME>>'))
    ).toMatchSnapshot();
  }
});

it('handles alternative propNames', async () => {
  const { code, metadata } = await transpile(
    dedent`
      import { styled } from 'linaria/react';

      const Page = state => styled.div\`
        color: #fff;
        &.${'${[state.primary]}'} {
          color: #241047;
        }
      \`
      `
  );
  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('collapses only one arrow function parent', async () => {
  const { code, metadata } = await transpile(
    dedent`
      import { styled } from 'linaria/react';

      export const Page = (props, options) => props => styled.div\`
      color: #fff;
      &.${'${[props.primary]}'} {
        color: #241047;
      }
      \`
      `
  );
  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('allows simple parent selector for state selector', async () => {
  const { code, metadata } = await transpile(
    dedent`
      import { styled } from 'linaria/react';

      export const Page = props => styled.div\`
        color: #fff;
        .dark-theme &.${'${[props.primary]}'} {
          color: #241047;
        }
      \`
      `
  );
  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
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
