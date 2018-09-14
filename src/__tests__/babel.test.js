/* eslint-disable no-template-curly-in-string */
/* @flow */

const babel = require('@babel/core');
const dedent = require('dedent');

const transpile = async input => {
  const { code } = await babel.transformAsync(input, {
    presets: [require.resolve('../babel')],
    filename: '/app/index.js',
  });

  return code;
};

it('transpiles styled template literal', async () => {
  const code = await transpile(
    dedent`
    const Title = styled('h1')\`
      font-size: 14px;
    \`;
    `
  );

  expect(code).toMatchSnapshot();
});

it('evaluates and inlines expressions in scope', async () => {
  const code = await transpile(
    dedent`
    const color = 'blue';

    const Title = styled('h1')\`
      color: ${'${color}'};
      width: ${'${100 / 3}'}%;
    \`;
    `
  );

  expect(code).toMatchSnapshot();
});

it('replaces unknown expressions with CSS custom properties', async () => {
  const code = await transpile(
    dedent`
    const Title = styled('h1')\`
      font-size: ${'${size}'}px;
      color: ${'${props => props.color}'}
    \`;
    `
  );

  expect(code).toMatchSnapshot();
});

it('uses the same custom property for the same identifier', async () => {
  const code = await transpile(
    dedent`
    const Box = styled('div')\`
      height: ${'${size}'}px;
      width: ${'${size}'}px;
    \`;
    `
  );

  expect(code).toMatchSnapshot();
});

it('uses the same custom property for the same expression', async () => {
  const code = await transpile(
    dedent`
    const Box = styled('div')\`
      height: ${'${props => props.size}'}px;
      width: ${'${props => props.size}'}px;
    \`;
    `
  );

  expect(code).toMatchSnapshot();
});

it('handles nested blocks', async () => {
  const code = await transpile(
    dedent`
    const Button = styled('button')\`
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
});

it('prevents class name collision', async () => {
  const code = await transpile(
    dedent`
    const Title = styled('h1')\`
      font-size: ${'${size}'}px;
      color: ${'${props => props.color}'}
    \`;

    function more() {
      const Title = styled('h1')\`
        font-family: ${'${regular}'};
      \`;
    }
    `
  );

  expect(code).toMatchSnapshot();
});

it('handles component in object property', async () => {
  const code = await transpile(
    dedent`
    const components = {
      title: styled('h1')\`
        font-size: 14px;
      \`
    };
    `
  );

  expect(code).toMatchSnapshot();
});

it('throws when not attached to a variable', async () => {
  expect.assertions(1);

  try {
    await transpile(
      dedent`
      styled('h1')\`
        font-size: ${'${size}'}px;
        color: ${'${props => props.color}'}
      \`;
      `
    );
  } catch (e) {
    expect(e.message).toMatchSnapshot();
  }
});

it('does not output CSS if none present', async () => {
  const code = await transpile(
    dedent`
      const number = 42;

      const title = String.raw\`This is something\`;
      `
  );

  expect(code).toMatchSnapshot();
});
