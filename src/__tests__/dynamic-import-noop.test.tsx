import * as babel from '@babel/core';

it('replaces dynamic imports with a noop', async () => {
  const { code } = await babel.transformAsync(
    `import('./foo').then(foo => foo.init())`,
    { plugins: [require.resolve('../babel/dynamic-import-noop')] }
  );

  expect(code).toMatchSnapshot();
});
