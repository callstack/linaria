// TypeScript Version: 2.9

declare module 'linaria' {
  type CSSProperties = {
    [key: string]: string | number | CSSProperties;
  };

  function css(
    strings: TemplateStringsArray,
    ...exprs: Array<string | number | CSSProperties>
  ): string;

  function cx(
    ...classNames: Array<string | false | undefined | null | 0>
  ): string;
}

declare module 'linaria/react' {
  import * as React from 'react';

  type CSSProperties = {
    [key: string]: string | number | CSSProperties;
  };

  type StyledComponent<T> = React.StatelessComponent<
    T & { as?: React.ReactType }
  >;

  type StyledTag<T> = <Props = T>(
    strings: TemplateStringsArray,
    ...exprs: Array<
      string | number | CSSProperties | ((props: Props) => string | number)
    >
  ) => StyledComponent<Props>;

  type StyledJSXIntrinsics = {
    readonly [P in keyof JSX.IntrinsicElements]: StyledTag<JSX.IntrinsicElements[P]>
  };

  const styled: StyledJSXIntrinsics & {
    <T>(component: React.ReactType<T>): StyledTag<T>;

    readonly [key: string]: StyledTag<{
      children?: React.ReactNode;
      [key: string]: any;
    }>;
  };
}

declare module 'linaria/server' {
  function collect(
    html: string,
    css: string
  ): { critical: string; other: string };
}
