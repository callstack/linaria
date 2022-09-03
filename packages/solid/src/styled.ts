import type { JSX, Component } from 'solid-js';

import type { CSSProperties } from '@linaria/core';
import type { StyledMeta } from '@linaria/tags';

type TagExpression<Props> =
  | string
  | number
  | CSSProperties
  | StyledMeta
  | ((props: Props) => string | number);

interface StyledComponent<Props> extends StyledMeta, Component<Props> {}

interface StyledTag<Props> {
  <AdditionalProps = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...expressions: readonly TagExpression<Props & AdditionalProps>[]
  ): StyledComponent<Props & AdditionalProps>;
}

interface Styled {
  <Props>(component: Component<Props>): StyledTag<Props>;
  <TagName extends keyof JSX.IntrinsicElements>(tagName: TagName): StyledTag<
    JSX.IntrinsicElements[TagName]
  >;
  (component: 'The target component must have a className prop'): never;
}

type StyledJSXIntrinsics = {
  readonly [TagName in keyof JSX.IntrinsicElements]: StyledTag<
    JSX.IntrinsicElements[TagName]
  >;
};

export declare const styled: Styled & StyledJSXIntrinsics;
