const babel = require('@babel/core');
const dedent = require('dedent');

const plugin = require('../src');

const getCode = (src: string) => {
  const { code } = babel.transform(dedent(src), {
    filename: 'test.js',
    babelrc: false,
    plugins: [plugin],
  });
  return code;
};

describe('styled-components', () => {
  it('keeps linaria', () => {
    const code = getCode(`
    import styled from "linaria/react";
    import Title from "./Title";

    export default styled.h1\`
      & > ${'${Title}'} {
        color: red;
      }
    \`;
  `);

    expect(code).toMatchSnapshot();
  });

  it('css', () => {
    const code = getCode(`
    import { css } from "styled-components";
    import Title from "./Title";

    export default css\`
      & > ${'${Title}'} {
        color: red;
      }
    \`;
  `);

    expect(code).toMatchSnapshot();
  });

  it('styled.h1', () => {
    const code = getCode(`
    import styled from "styled-components";
    import Title from "./Title";

    export default styled.h1\`
      & > ${'${Title}'} {
        color: red;
      }
    \`;
  `);

    expect(code).toMatchSnapshot();
  });

  it('member expression as selector', () => {
    const code = getCode(`
    import styled from "styled-components";
    import Title from "./Title";

    export default styled.h1\`
      & > ${'${Title.Small}'} {
        color: red;
      }
    \`;
  `);

    expect(code).toMatchSnapshot();
  });

  it('styled(Cmp)', () => {
    const code = getCode(`
    import styled from "styled-components";
    import Cmp from "./Cmp";
    import Title from "./Title";

    export default styled(Cmp)\`
      & > ${'${Title}'} {
        color: red;
      }
    \`;
  `);

    expect(code).toMatchSnapshot();
  });

  it('styled(Cmp).attrs({})', () => {
    const code = getCode(`
    import styled from "styled-components";
    import Cmp from "./Cmp";
    import Title from "./Title";

    export default styled(Cmp).attrs(() => ({}))\`
      & > ${'${Title}'} {
        color: red;
      }
    \`;
  `);

    expect(code).toMatchSnapshot();
  });

  it('styled.h1.attrs({})', () => {
    const code = getCode(`
    import styled from "styled-components";
    import Title from "./Title";

    export default styled.h1.attrs(() => ({}))\`
      & > ${'${Title}'} {
        color: red;
      }
    \`;
  `);

    expect(code).toMatchSnapshot();
  });
});
