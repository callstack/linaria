import * as React from 'react'; // eslint-disable-line import/no-extraneous-dependencies
import validAttr from '@emotion/is-prop-valid';
import { cx } from '../index';
import { StyledMeta } from '../types';

type Options = {
  name: string;
  class: string;
  vars?: {
    [key: string]: [
      string | number | ((props: unknown) => string | number),
      string | void
    ];
  };
};

const warnIfInvalid = (value: any, componentName: string) => {
  if (process.env.NODE_ENV !== 'production') {
    if (
      typeof value === 'string' ||
      // eslint-disable-next-line no-self-compare
      (typeof value === 'number' && isFinite(value))
    ) {
      return;
    }

    const stringified =
      typeof value === 'object' ? JSON.stringify(value) : String(value);

    // eslint-disable-next-line no-console
    console.warn(
      `An interpolation evaluated to '${stringified}' in the component '${componentName}', which is probably a mistake. You should explicitly cast or transform the value to a string.`
    );
  }
};

// If styled wraps custom component, that component should have className property
function styled<TConstructor extends React.FunctionComponent<any>>(
  tag: TConstructor extends React.FunctionComponent<infer T>
    ? T extends { className?: string }
      ? TConstructor
      : never
    : never
): ComponentStyledTag<TConstructor>;
function styled<T>(
  tag: T extends { className?: string } ? React.ComponentType<T> : never
): ComponentStyledTag<T>;
function styled<TName extends keyof JSX.IntrinsicElements>(
  tag: TName
): HtmlStyledTag<TName>;
function styled(tag: any): any {
  return (options: Options) => {
    if (process.env.NODE_ENV !== 'production') {
      if (Array.isArray(options)) {
        // We received a strings array since it's used as a tag
        throw new Error(
          'Using the "styled" tag in runtime is not supported. Make sure you have set up the Babel plugin correctly. See https://github.com/callstack/linaria#setup'
        );
      }
    }

    const render = (props: any, ref: any) => {
      const { as: component = tag, class: className, ...rest } = props;

      let filteredProps;

      // Check if it's an HTML tag and not a custom element
      if (typeof component === 'string' && component.indexOf('-') === -1) {
        filteredProps = {} as { [key: string]: any };

        // eslint-disable-next-line guard-for-in
        for (const key in rest) {
          if (key === 'as' || validAttr(key)) {
            // Don't pass through invalid attributes to HTML elements
            filteredProps[key] = rest[key];
          }
        }
      } else {
        filteredProps = rest;
      }

      filteredProps.ref = ref;
      filteredProps.className = cx(
        filteredProps.className || className,
        options.class
      );

      const { vars } = options;

      if (vars) {
        const style: { [key: string]: string } = {};

        // eslint-disable-next-line guard-for-in
        for (const name in vars) {
          const [result, unit = ''] = vars[name];
          const value = typeof result === 'function' ? result(props) : result;

          warnIfInvalid(value, options.name);

          style[`--${name}`] = `${value}${unit}`;
        }

        filteredProps.style = Object.assign(style, filteredProps.style);
      }

      if ((tag as any).__linaria && tag !== component) {
        // If the underlying tag is a styled component, forward the `as` prop
        // Otherwise the styles from the underlying component will be ignored
        filteredProps.as = component;

        return React.createElement(tag, filteredProps);
      }

      return React.createElement(component, filteredProps);
    };

    const Result = React.forwardRef
      ? React.forwardRef(render)
      : // React.forwardRef won't available on older React versions and in Preact
        // Fallback to a innerRef prop in that case
        ({ innerRef, ...rest }: any) => render(rest, innerRef);

    (Result as any).displayName = options.name;

    // These properties will be read by the babel plugin for interpolation
    (Result as any).__linaria = {
      className: options.class,
      extends: tag,
    };

    return Result;
  };
}

type CSSProperties = {
  [key: string]: string | number | CSSProperties;
};

type StyledComponent<T> = StyledMeta &
  (T extends React.FunctionComponent<any>
    ? T
    : React.FunctionComponent<T & { as?: React.ElementType }>);

type StaticPlaceholder = string | number | CSSProperties | StyledMeta;

type HtmlStyledTag<TName extends keyof JSX.IntrinsicElements> = (
  strings: TemplateStringsArray,
  ...exprs: Array<
    | StaticPlaceholder
    | ((props: JSX.IntrinsicElements[TName]) => string | number)
  >
) => StyledComponent<JSX.IntrinsicElements[TName]>;

type ComponentStyledTag<T> = <
  Props = T extends React.FunctionComponent<infer TProps> ? TProps : T
>(
  strings: TemplateStringsArray,
  // Expressions can contain functions only if wrapped component has style property
  ...exprs: Props extends { style?: React.CSSProperties }
    ? Array<StaticPlaceholder | ((props: Props) => string | number)>
    : StaticPlaceholder[]
) => T extends React.FunctionComponent<any>
  ? StyledMeta & T
  : StyledComponent<Props>;

type StyledJSXIntrinsics = {
  readonly [P in keyof JSX.IntrinsicElements]: HtmlStyledTag<P>
};

export type Styled = typeof styled & StyledJSXIntrinsics;

export default (process.env.NODE_ENV !== 'production'
  ? new Proxy(styled, {
      get(o, prop: keyof JSX.IntrinsicElements) {
        return o(prop);
      },
    })
  : styled) as Styled;
