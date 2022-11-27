/* eslint-disable @typescript-eslint/no-unused-vars */
import type { ComponentProps, JSX } from 'solid-js';
import { type Component } from 'solid-js';

import { styled } from '../src';

type Extends<A, B> = A extends B ? true : false;
declare function isAssignable<Source, Target>(): Source extends Target
  ? true
  : false;
declare function isEqual<Source, Target>(): [Source, Target] extends [
  Target,
  Source
]
  ? true
  : false;

{
  // returns tag component taking only html props
  const C = styled.div`
    ${(props) => {
      // $ExpectType true
      isEqual<typeof props, JSX.HTMLAttributes<HTMLDivElement>>();
      return undefined;
    }}
  `;
  // $ExpectType true
  isAssignable<typeof C, Component<JSX.HTMLAttributes<HTMLDivElement>>>();
  // $ExpectType false
  isAssignable<{ foo: string }, ComponentProps<typeof C>>();
}

{
  // allows adding extra props
  interface ExtraProps {
    readonly foo: string;
  }
  const C = styled.div<ExtraProps>`
    ${(props) => {
      // $ExpectType true
      isEqual<typeof props, JSX.HTMLAttributes<HTMLDivElement> & ExtraProps>();
      return undefined;
    }}
  `;
  // $ExpectType true
  isAssignable<
    typeof C,
    Component<JSX.HTMLAttributes<HTMLDivElement> & ExtraProps>
  >();
  type Props = ComponentProps<typeof C>;
  // $ExpectType false
  isAssignable<Props, Record<string, unknown>>();
  // $ExpectType true
  isAssignable<Props, { foo: string }>();
  // $ExpectType false
  isAssignable<Props, { foo: string; bar: number }>();
}

{
  // allows styled component interpolation
  const A = styled.div``;
  const B = styled.div`
    // show not raise error
    ${A} {
    }
  `;
}

((/* Issue #872 */) => {
  interface BaseProps {
    readonly class?: string;
    readonly style?: JSX.CSSProperties;
  }

  interface ResultProps extends BaseProps {
    title: string;
  }

  const Flow = <TProps extends BaseProps>(Cmp: Component<TProps>) =>
    styled(Cmp)`
      display: flow;
    `;

  const Component: Component<ResultProps> = (props) => <div {...props}></div>;

  const Implementation = Flow(Component);

  (() => <Implementation title={'title'} />)();
})();
