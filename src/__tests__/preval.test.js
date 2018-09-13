/* @flow */

const path = require('path');
const babel = require('@babel/core');
const dedent = require('dedent');

const transpile = async input => {
  const { code } = await babel.transformAsync(input, {
    babelrc: false,
    presets: [[require.resolve('../babel'), { evaluate: true }]],
    filename: path.join(__dirname, 'source.js'),
  });

  // The slug will be machine specific, so replace it with a consistent one
  return code
    .replace(/((_)|(--))[a-z0-9]{7,8}/g, '$1abcdefg')
    .replace(/(")[a-z0-9]{7,8}(-)/g, '$1abcdefg$2');
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
    import slugify from '../slugify';

    const Title = styled('h1')\`
      &:before {
        content: "${"${slugify('test')}"}"
      }
    \`;
    `
  );

  expect(code).toMatchSnapshot();
});

it('evaluates expressions with expressions depending on shared dependency', async () => {
  const code = await transpile(
    dedent`
    const slugify = require('../slugify');

    const boo = t => slugify(t) + 'boo';
    const bar = t => slugify(t) + 'bar';

    const Title = styled('h1')\`
      &:before {
        content: "${"${boo('test') + bar('test')}"}"
      }
    \`;
    `
  );

  expect(code).toMatchSnapshot();
});

it('evaluates multiple expressions with shared dependency', async () => {
  const code = await transpile(
    dedent`
    const slugify = require('../slugify');

    const boo = t => slugify(t) + 'boo';
    const bar = t => slugify(t) + 'bar';

    const Title = styled('h1')\`
      &:before {
        content: "${"${boo('test')}"}"
        content: "${"${bar('test')}"}"
      }
    \`;
    `
  );

  expect(code).toMatchSnapshot();
});

it('evaluates component interpolations', async () => {
  const code = await transpile(
    dedent`
    const styled = require('../styled');

    const Title = styled('h1')\`
      color: red;
    \`;

    const Paragraph = styled('p')\`
      ${'${Title}'} {
        color: blue
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
