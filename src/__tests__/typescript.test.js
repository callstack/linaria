/* eslint-disable no-template-curly-in-string */

const path = require('path');
const babel = require('@babel/core');
const dedent = require('dedent');
const serializer = require('../__utils__/linaria-snapshot-serializer');

expect.addSnapshotSerializer(serializer);

const transpile = input =>
  babel.transformAsync(input, {
    babelrc: false,
    presets: [[require.resolve('../babel'), { evaluate: false }]],
    plugins: ['@babel/plugin-transform-typescript', '@babel/plugin-syntax-jsx'],
    filename: path.join(__dirname, 'app/index.js'),
  });

it('handles basic typescript', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from 'linaria/react';

    interface TitleProps {
      size?: number
    }

    export const Title = (props => styled.h1<TitleProps>\`
      font-size: ${'${props.size}'}px;
    \`)({} as TitleProps);
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('handles filterProps with typescript', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from 'linaria/react';

    interface TitleProps {
      size?: number
    }

    export const Title = (props => styled.h1<TitleProps>\`
      /* do: comment */
      ${'${{ filterProps: ({ size, ...o }) => o }}'}
      font-size: ${'${props.size}'}px;
    \`)({} as TitleProps);
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});

it('handles object access', async () => {
  const { code, metadata } = await transpile(
    dedent`
    import { styled } from 'linaria/react';

    const theme = {
      size: {
        small: '5em',
        big: '10em'
      }
    } as const;

    interface TitleProps {
      size?: number
    }

    export const Title = (props => styled.h1<TitleProps>\`
      font-size: ${'${props => theme.size[props.size]}'}px;
    \`)({} as TitleProps);
    `
  );

  expect(code).toMatchSnapshot();
  expect(metadata).toMatchSnapshot();
});
