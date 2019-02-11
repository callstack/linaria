/* eslint-disable no-template-curly-in-string */
/* @flow */

const path = require('path');
const babel = require('@babel/core');
const dedent = require('dedent');
const stripAnsi = require('strip-ansi');
const serializer = require('../__utils__/linaria-snapshot-serializer');

expect.addSnapshotSerializer(serializer);

const babelrc = {
  babelrc: false,
  presets: [
    [require.resolve('../babel'), { displayName: true, evaluate: true }],
  ],
};

const transpile = async input => {
  const { code, metadata } = await babel.transformAsync(input, {
    ...babelrc,
    filename: path.join(__dirname, 'source.js'),
  });

  // The slug will be machine specific, so replace it with a consistent one
  return {
    metadata,
    code,
  };
};

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
    const slugify = require('../slugify');

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
    const slugify = require('../slugify');

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

it('throws when interpolation evaluates to an array', async () => {
  expect.assertions(1);

  try {
    await transpile(
      dedent`
      const { styled } = require('../react');

      const borderRadius = ['2px', '0', '2px'];

      export const Title = styled.h1\`
        border-radius: ${'${borderRadius}'}px;
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
    const { styled } = require('../react');

    const Title = styled.h1\`
      color: red;
    \`;

    export const CustomTitle = styled(Title)\`
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
  const { code, metadata } = await babel.transformFileAsync(
    path.resolve(__dirname, '../__fixtures__/escape-character.js'),
    babelrc
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});
