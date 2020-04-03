import * as babel from '@babel/core';
import dedent from 'dedent';
import { join } from 'path';
import serializer from '../../__utils__/linaria-snapshot-serializer';
import { StrictOptions } from '../../babel/types';

expect.addSnapshotSerializer(serializer);

const options: Partial<StrictOptions> = {
  displayName: true,
  evaluate: true,
};

const transpile = async (input: string) =>
  (await babel.transformAsync(input, {
    babelrc: false,
    presets: [[require.resolve('../../babel/evaluators/preeval'), options]],
    plugins: [
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-syntax-jsx',
    ],
    filename: join(__dirname, 'app/index.js'),
    configFile: false,
  }))!;

it('preserves classNames', async () => {
  const { code } = await transpile(
    dedent`
      import { styled } from 'linaria/react';
      
      const Component = styled.div\`\`;
      `
  );

  expect(code).toMatchSnapshot();
});

it('handles locally named import', async () => {
  const { code } = await transpile(
    dedent`
      import { styled as custom } from 'linaria/react';
      
      const Component = custom.div\`\`;
      `
  );

  expect(code).toMatchSnapshot();
});

it('replaces functional component', async () => {
  const div = '<div>{props.children}</div>';
  const { code } = await transpile(
    dedent`
      import React from 'react';
      
      const Component = (props) => ${div};
      `
  );

  expect(code).toMatchSnapshot();
});

it('replaces class component', async () => {
  const div = '<div>{props.children}</div>';
  const { code } = await transpile(
    dedent`
      import React from 'react';
      
      class Component extends React.PureComponent {
        render() {
          return ${div};
        }
      }
      `
  );

  expect(code).toMatchSnapshot();
});

it('replaces constant', async () => {
  const div = '<div>{props.children}</div>';
  const { code } = await transpile(
    dedent`
      import React from 'react';
      
      const tag = ${div};
      
      const Component = (props) => tag;
      `
  );

  expect(code).toMatchSnapshot();
});
