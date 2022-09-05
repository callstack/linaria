import * as babel from '@babel/core';
// import {} from '@linaria/babel-preset';
import dedent from 'dedent';

import { styled } from '@linaria/solid';

function transform(source: string): string {
  const result = babel.transform(source, {
    babelrc: false,
    configFile: false,
    filename: 'test.tsx',
    presets: ['@linaria/babel-preset'],
  });
  if (!result || !result.code)
    throw new Error('Babel cannot parse source code');
  return dedent(result.code.trim());
}

describe('styled processor', () => {
  it('renders tag', () => {
    // const result = transform(`
    //   import { styled } from '@linaria/solid'
    //   export const Component = styled.div\`\`
    // `);
    // expect(result).toEqual(
    //   dedent(`
    //   export const Component = props => {
    //     const className = "cg10ziu" + (props.class ? " " + props.class : "");
    //     const style = props.style;
    //     return <div {...props} class={className} style={style} />;
    //   };
    // `)
    // );
    // const Component = styled.div`
    //   color: blue;
    // `;
    // console.log(Component);
    console.log(styled);
  });
});
