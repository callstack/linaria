/* tslint:disable:no-unnecessary-generics */
// eslint-disable-next-line import/no-extraneous-dependencies
import * as React from 'react';

import { css } from '@linaria/core';

import { styled } from '../src';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isExtends<C, T>(arg1?: C, arg2?: T): C extends T ? 'extends' : never {
  // It will never be executed, so the result doesn't matter.
  return null as any;
}

const Fabric =
  <T>(): React.FC<T> =>
  (props) =>
    React.createElement('div', props);

const Header = (p: { children: string }) => React.createElement('h1', p);

const Generic = <T>(
  p: T & { className?: string; style?: React.CSSProperties }
) => React.createElement('h1', p);

const StyledDiv = styled.div``;
// $ExpectType "extends"
isExtends<typeof StyledDiv, React.FC<React.DetailedHTMLProps<any, any>>>();

const A = (): React.ReactElement => React.createElement('div', null);
// $ExpectError
styled(A)``;

// foo is not a valid property of div
// $ExpectError
React.createElement(StyledDiv, { foo: 'foo' });

const ReStyledDiv = styled(StyledDiv)<{ foo: string }>``;
React.createElement(ReStyledDiv, { foo: 'foo' });

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

((/* Issue #844 */) => {
  type GridProps = { container?: false } | { container: true; spacing: number };

  const Grid: React.FC<GridProps & { className?: string }> = () => null;

  // Type 'false' is not assignable to type 'true'
  // $ExpectError
  React.createElement(Grid, { container: false, spacing: 8 });

  React.createElement(Grid, { container: true, spacing: 8 });

  styled(Grid)``;
})();

((/* Issue #872 */) => {
  interface BaseProps {
    className?: string;
    style?: React.CSSProperties;
  }

  interface ComponentProps extends BaseProps {
    title: string;
  }

  const Flow = <TProps extends BaseProps>(Cmp: React.FC<TProps>) =>
    styled(Cmp)`
      display: flow;
    `;

  const Component: React.FC<ComponentProps> = (props) =>
    React.createElement('div', props);

  const Implementation = Flow(Component);

  (() => React.createElement(Implementation, { title: 'Title' }))();
})();
