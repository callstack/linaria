// eslint-disable-next-line import/no-extraneous-dependencies
import * as React from 'react';
import type { Validator } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { expect } from 'tstyche';

import { css } from '@linaria/core';

import { styled } from '..';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isExtends<C, T>(arg1?: C, arg2?: T): C extends T ? 'extends' : never {
  // It will never be executed, so the result doesn't matter.
  return null as any;
}

const Fabric =
  <T extends React.HTMLAttributes<'div'>>(): React.FC<T> =>
  (props) =>
    React.createElement('div', props);

const Header = (p: { children: string }) => React.createElement('h1', p);

const Generic = <T>(
  p: T & { className?: string; style?: React.CSSProperties }
) => React.createElement('h1', p);

const StyledDiv = styled.div``;
expect(
  isExtends<typeof StyledDiv, React.FC<React.DetailedHTMLProps<any, any>>>()
).type.toBe<'extends'>();

const StyledButton = styled.button``;
StyledButton({ as: 'a', href: '/' });
StyledButton.defaultProps = { as: 'a' };
// @ts-expect-error href requires an anchor-like target
StyledButton({ href: '/' });
// @ts-expect-error href is not a button property
StyledButton({ as: 'button', href: '/' });

const A = (): React.ReactElement => React.createElement('div', null);
// @ts-expect-error
styled(A)``;

// foo is not a valid property of div
// @ts-expect-error
React.createElement(StyledDiv, { foo: 'foo' });

const ReStyledDiv = styled(StyledDiv)<{ foo: string }>``;
React.createElement(ReStyledDiv, { foo: 'foo' });

// component should have className property
// @ts-expect-error
styled(Fabric<{ a: string }>())``;

// className property should be string
// @ts-expect-error
styled(Fabric<{ className: number }>())``;

const SimplestComponent = styled(Fabric<{ className: string }>())``;
expect(
  isExtends<typeof SimplestComponent, React.FC<{ className: string }>>()
).type.toBe<'extends'>();

styled(Fabric<{ className: string }>())`
  // component should have style property
  color: ${
    // @ts-expect-error
    () => 'red'
  };
`;

styled(Fabric<{ className: string }>())`
  // it looks like function, but it's a reference to another styled component
  & > ${SimplestComponent} {
    color: red;
  }
`;

styled(Fabric<{ className: string }>())`
  // it looks like the previous test, but it references a non-linaria component
  &
    > ${
      // @ts-expect-error
      Header
    } {
    color: red;
  }
`;

styled(Fabric<{ className: string; style: {} }>())`
  color: ${() => 'red'};
`;

styled(Fabric<{ className: string; style: {} }>())`
  // color should be defined in props
  color: ${
    // @ts-expect-error
    (props) => props.color
  };
`;

styled(Fabric<{ className: string; color: 'red' | 'blue'; style: {} }>())`
  & > ${SimplestComponent} {
    color: ${(props) => props.color};
  }
`;

expect(Generic({ children: 123 }).props.children).type.toBe<number>();

const StyledGeneric = styled(Generic)``;
expect(StyledGeneric({ children: 123 }).props.children).type.toBe<number>();

styled.a`
  & > ${SimplestComponent} {
    color: red;
  }
`({ href: 'about:blank' });

((/* Issue #536 */) => {
  const Title = styled.div<{ background: string }>`
    background: ${(props) => props.background};
  `;

  expect(
    isExtends<typeof Title, React.FC<{ background: string }>>()
  ).type.toBe<'extends'>();

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

  expect(Card.propTypes!.id).type.toBe<Validator<number> | undefined>();

  const styledTag = styled(Wrapper);

  const NewWrapper = styledTag<{ prop2: string }>`
    width: 2em;
    background-color: ${(props) => (props.prop1 ? 'transparent' : 'red')};
    color: ${(props) => props.prop2};
  `;

  const { propTypes } = NewWrapper;

  expect(propTypes!.prop1).type.toBe<Validator<boolean> | undefined>();

  expect(propTypes!.prop2).type.toBe<Validator<string> | undefined>();
})();

((/* Issue #844 */) => {
  type GridProps = { container?: false } | { container: true; spacing: number };

  const Grid: React.FC<GridProps & { className?: string }> = () => null;

  // Type 'false' is not assignable to type 'true'
  // @ts-expect-error
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

  const Flow = <TProps extends BaseProps>(Cmp: React.FC<TProps>) => styled(Cmp)`
    display: flow;
  `;

  const Component: React.FC<ComponentProps> = (props) =>
    React.createElement('div', props);

  const Implementation = Flow(Component);

  (() => React.createElement(Implementation, { title: 'Title' }))();
})();
