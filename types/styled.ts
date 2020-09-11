// eslint-disable-next-line import/no-extraneous-dependencies
import * as React from 'react';
import { css } from '../src';
import { styled } from '../src/react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isExtends<C, T>(arg1?: C, arg2?: T): C extends T ? 'extends' : never {
  // It will never be executed, so the result doesn't matter.
  return null as any;
}

// tslint:disable-next-line no-unnecessary-generics
const Fabric = <T>(): React.FC<T> => (props) =>
  React.createElement('div', props);

const Header = (p: { children: string }) => React.createElement('h1', p);

// tslint:disable-next-line no-unnecessary-generics
const Generic = <T>(p: T & { className?: string }) =>
  React.createElement('h1', p);

const StyledDiv = styled.div``;
// $ExpectType "extends"
isExtends<typeof StyledDiv, React.FC<React.DetailedHTMLProps<any, any>>>();

// component should have className property
// $ExpectError
styled(Fabric<{ a: string }>())``;

// className property should be string
// $ExpectError
styled(Fabric<{ className: number }>())``;

const SimplestComponent = styled(Fabric<{ className: string }>())``;
// $ExpectType "extends"
isExtends<typeof SimplestComponent, React.FC<{ className: string }>>();

styled(Fabric<{ className: string }>())`
  // component should have style property
  // $ExpectError
  color: ${() => 'red'};
`;

styled(Fabric<{ className: string }>())`
  // it looks like function, but it's a reference to another styled component
  & > ${SimplestComponent} {
    color: red;
  }
`;

styled(Fabric<{ className: string }>())`
  // it looks like the previous test, but it references a non-linaria component
  // $ExpectError
  & > ${Header} {
    color: red;
  }
`;

styled(Fabric<{ className: string; style: {} }>())`
  color: ${() => 'red'};
`;

styled(Fabric<{ className: string; style: {} }>())`
  // color should be defined in props
  // $ExpectError
  color: ${(props) => props.color};
`;

styled(Fabric<{ className: string; style: {}; color: 'red' | 'blue' }>())`
  & > ${SimplestComponent} {
    color: ${(props) => props.color};
  }
`;

// $ExpectType number
Generic({ children: 123 }).props.children;

const StyledGeneric = styled(Generic)``;
// $ExpectType number
StyledGeneric({ children: 123 }).props.children;

styled.a`
  & > ${SimplestComponent} {
    color: red;
  }
`({ href: 'about:blank' });

((/* Issue #536 */) => {
  const Title = styled.div<{ background: string }>`
    background: ${(props) => props.background};
  `;

  // $ExpectType "extends"
  isExtends<typeof Title, React.FC<{ background: string }>>();

  css`
    ${Title} {
      color: green;
    }
  `;
})();

((/* Issue #622 */) => {
  const Wrapper = styled.div<{ prop1: boolean }>`
    width: 1em;
    background-color: ${(props) => (props.prop1 ? 'transparent' : 'green')};
  `;

  const Custom: React.FC<{ className?: string; id: number }> = () => null;

  const tag = styled(Custom);
  const Card = tag`
    ${Wrapper} {
      color: green;
    }
  `;

  // $ExpectType Validator<number> | undefined
  Card.propTypes!.id;

  const styledTag = styled(Wrapper);

  const NewWrapper = styledTag<{ prop2: string }>`
    width: 2em;
    background-color: ${(props) => (props.prop1 ? 'transparent' : 'red')};
    color: ${(props) => props.prop2};
  `;

  // $ExpectType Validator<boolean> | undefined
  NewWrapper.propTypes!.prop1;

  // $ExpectType Validator<string> | undefined
  NewWrapper.propTypes!.prop2;
})();
