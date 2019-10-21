// eslint-disable-next-line import/no-extraneous-dependencies
import * as React from 'react';
import { styled } from '../src/react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isExtends<C, T>(arg1?: C, arg2?: T): C extends T ? 'extends' : never {
  // It will never be executed, so the result doesn't matter.
  return null as any;
}

// tslint:disable-next-line no-unnecessary-generics
const Fabric = <T>(): React.FC<T> => props => React.createElement('div', props);

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
  color: ${props => props.color};
`;

styled(Fabric<{ className: string; style: {}; color: 'red' | 'blue' }>())`
  color: ${props => props.color};
`;

// $ExpectType number
Generic({ children: 123 }).props.children;

const StyledGeneric = styled(Generic)``;
// $ExpectType number
StyledGeneric({ children: 123 }).props.children;
