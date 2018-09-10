/* @flow */

const babel = require('@babel/core');
const dedent = require('dedent');

it('should extract CSS to a comment', async () => {
  const { code } = await babel.transformAsync(
    dedent`
    var background = 'blue';

    const container = styled('div')\`
      background-color: ${'${background}'};
      color: ${'${props => props.color}'};
      width: ${'${100 / 3}'};
      border: 1px solid red;
    \`;
    `,
    {
      plugins: [require.resolve('../src/index')],
      filename: '/app/index.js',
    }
  );

  expect(code).toMatchSnapshot();
});
