/* @flow */

const babel = require('@babel/core');
const dedent = require('dedent');

const transpile = async input => {
  const { code } = await babel.transformAsync(input, {
    presets: [[require.resolve('../babel'), { evaluate: true }]],
    filename: '/app/index.js',
  });

  return code;
};

it('evaluates identifier in scope', async () => {
  const code = await transpile(
    dedent`
    const answer = 42;
    const foo = () => answer;
    const days = foo() + ' days';

    const Title = styled('h1')\`
      &:before {
        content: "${'${days}'}"
      }
    \`;
    `
  );

  expect(code).toMatchSnapshot();
});

it('evaluates local expressions', async () => {
  const code = await transpile(
    dedent`
    const answer = 42;
    const foo = () => answer;

    const Title = styled('h1')\`
      &:before {
        content: "${"${foo() + ' days'}"}"
      }
    \`;
    `
  );

  expect(code).toMatchSnapshot();
});

it('evaluates expressions with dependencies', async () => {
  const code = await transpile(
    dedent`
    const slugify = require('../slugify');

    const Title = styled('h1')\`
      &:before {
        content: "${"${slugify('test')}"}"
      }
    \`;
    `
  );

  expect(code).toMatchSnapshot();
});

it('ignores inline arrow function expressions', async () => {
  const code = await transpile(
    dedent`
    const Title = styled('h1')\`
      &:before {
        content: "${'${props => props.content}'}"
      }
    \`;
    `
  );

  expect(code).toMatchSnapshot();
});

it('ignores inline vanilla function expressions', async () => {
  const code = await transpile(
    dedent`
    const Title = styled('h1')\`
      &:before {
        content: "${'${function(props) { return props.content }}'}"
      }
    \`;
    `
  );

  expect(code).toMatchSnapshot();
});

it('ignores external expressions', async () => {
  const code = await transpile(
    dedent`
    const generate = props => props.content;

    const Title = styled('h1')\`
      &:before {
        content: "${'${generate}'}"
      }
    \`;
    `
  );

  expect(code).toMatchSnapshot();
});
