import type { JSX, Component } from 'solid-js';

import type { CSSProperties } from '@linaria/core';
import type { StyledMeta } from '@linaria/tags';

type TagExpression<Props> =
  | string
  | number
  | CSSProperties
  | StyledMeta
  | (Props extends { readonly style?: JSX.CSSProperties | string }
      ? (props: Props) => string | number | undefined
      : (props: 'The target component must have a style prop') => unknown);

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
  (componentWithStyle: () => unknown): (
    error: 'The target component must have a class prop'
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
