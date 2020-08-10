import { transformAsync } from '@babel/core';

it('replaces dynamic imports with a noop', async () => {
  const { code } = await transformAsync(
    `import('./foo').then(foo => foo.init())`,
    {
      plugins: [require.resolve('../babel/dynamic-import-noop')],
      filename: 'source.js',
      configFile: false,
      babelrc: false,
    }
  );

  expect(code).toMatchSnapshot();
});
