import type { JSX, Component } from 'solid-js';

import type { CSSProperties } from '@linaria/core';
import type { StyledMeta } from '@linaria/tags';

type TagExpression<Props> =
  | string
  | number
  | CSSProperties
  | StyledMeta
  | ((props: Props) => string | number | undefined);

export interface StyledComponent<Props> extends StyledMeta, Component<Props> {}

export interface StyledTag<Props> {
  (
    strings: TemplateStringsArray,
    ...expressions: readonly TagExpression<Props>[]
  ): StyledComponent<Props>;
  <AdditionalProps = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...expressions: readonly TagExpression<Props & AdditionalProps>[]
  ): StyledComponent<Props & AdditionalProps>;
}
export interface Styled {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (componentWithStyle: () => any): (
    error: 'The target component should have a class prop'
  ) => void;
  <Props extends { readonly class?: string }>(
    component: Component<Props>
  ): StyledTag<Props>;
}

type StyledJSXIntrinsics = {
  readonly [TagName in keyof JSX.IntrinsicElements]: StyledTag<
    JSX.IntrinsicElements[TagName]
  >;
};

export const styled: Styled & StyledJSXIntrinsics = (() => {
  throw new Error(
    'Using the "styled" tag in runtime is not supported. Make sure you have set up the Babel plugin correctly. See https://github.com/callstack/linaria#setup'
  );
}) as never;
