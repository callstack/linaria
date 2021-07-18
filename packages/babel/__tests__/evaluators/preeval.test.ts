import { join } from 'path';
import { transformAsync } from '@babel/core';
import dedent from 'dedent';
import serializer from '../../__utils__/linaria-snapshot-serializer';
import type { StrictOptions } from '../../src';

expect.addSnapshotSerializer(serializer);

const options: Partial<StrictOptions> = {
  displayName: true,
  evaluate: true,
};

const transpile = async (input: string) =>
  (await transformAsync(input, {
    babelrc: false,
    presets: [[require.resolve('@linaria/preeval'), options]],
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
      import { styled } from '@linaria/react';

      const Component = styled.div\`\`;
      `
  );

  expect(code).toMatchSnapshot();
});

it('handles locally named import', async () => {
  const { code } = await transpile(
    dedent`
      import { styled as custom } from '@linaria/react';

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

it('hoists exports', async () => {
  const { code } = await transpile(
    dedent`
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      Object.defineProperty(exports, "foo", {
        enumerable: true,
        get: function get() {
          return _foo.foo;
        }
      });
      Object.defineProperty(exports, "bar", {
        enumerable: true,
        get: function get() {
          return _foo.bar;
        }
      });

      var _foo = require("./foo");
    `
  );

  expect(code).toMatchSnapshot();
});
