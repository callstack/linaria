/**
 * This file contains an runtime version of `styled` component. Responsibilities of the component are:
 * - returns ReactElement based on HTML tag used with `styled` or custom React Component
 * - injects classNames for the returned component
 * - injects CSS variables used to define dynamic styles based on props
 */
import React from 'react';
import validAttr from '@emotion/is-prop-valid';
import { cx } from '@linaria/core';
import type { CSSProperties, StyledMeta } from '@linaria/core';

export type NoInfer<A extends any> = [A][A extends any ? 0 : never];

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

interface CustomOmit {
  <T extends object, K extends [...(keyof T)[]]>(obj: T, keys: K): {
    [K2 in Exclude<keyof T, K[number]>]: T[K2];
  };
}

// Workaround for rest operator
export const restOp: CustomOmit = (obj, keys) => {
  const res = {} as { [K in keyof typeof obj]: typeof obj[K] };
  let key: keyof typeof obj;
  for (key in obj) {
    if (keys.indexOf(key) === -1) {
      res[key] = obj[key];
    }
  }
  return res;
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

interface IProps {
  className?: string;
  style?: Record<string, string>;
  [props: string]: unknown;
}

// If styled wraps custom component, that component should have className property
function styled<TConstructor extends React.ComponentType<any>>(
  tag: TConstructor extends React.ComponentType<infer T>
    ? [T] extends [{ className?: string | undefined }]
      ? TConstructor
      : never
    : never
): ComponentStyledTag<TConstructor>;
function styled<T>(
  tag: [T] extends [{ className?: string | undefined }]
    ? React.ComponentType<T>
    : never
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
      const { as: component = tag, class: className } = props;
      const rest = restOp(props, ['as', 'class']);
      let filteredProps: IProps;

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
          const variable = vars[name];
          const result = variable[0];
          const unit = variable[1] || '';
          const value = typeof result === 'function' ? result(props) : result;

          warnIfInvalid(value, options.name);

          style[`--${name}`] = `${value}${unit}`;
        }

        const ownStyle = filteredProps.style || {};
        const keys = Object.keys(ownStyle);
        if (keys.length > 0) {
          keys.forEach((key) => {
            style[key] = ownStyle[key];
          });
        }

        filteredProps.style = style;
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
        (props: any) => {
          const rest = restOp(props, ['innerRef']);
          return render(rest, props.innerRef);
        };

    (Result as any).displayName = options.name;

    // These properties will be read by the babel plugin for interpolation
    (Result as any).__linaria = {
      className: options.class,
      extends: tag,
    };

    return Result;
  };
}

type StyledComponent<T> = StyledMeta &
  ([T] extends [React.FunctionComponent<any>]
    ? T
    : React.FunctionComponent<T & { as?: React.ElementType }>);

type StaticPlaceholder = string | number | CSSProperties | StyledMeta;

type HtmlStyledTag<TName extends keyof JSX.IntrinsicElements> = <
  TAdditionalProps = {}
>(
  strings: TemplateStringsArray,
  ...exprs: Array<
    | StaticPlaceholder
    | ((
        // Without Omit here TS tries to infer TAdditionalProps
        // from a component passed for interpolation
        props: JSX.IntrinsicElements[TName] & Omit<TAdditionalProps, never>
      ) => string | number)
  >
) => StyledComponent<JSX.IntrinsicElements[TName] & TAdditionalProps>;

type ComponentStyledTag<T> = <
  OwnProps = {},
  TrgProps = [T] extends [React.FunctionComponent<infer TProps>] ? TProps : T
>(
  strings: TemplateStringsArray,
  // Expressions can contain functions only if wrapped component has style property
  ...exprs: TrgProps extends { style?: React.CSSProperties | undefined }
    ? Array<
        | StaticPlaceholder
        | ((props: NoInfer<OwnProps & TrgProps>) => string | number)
      >
    : StaticPlaceholder[]
) => keyof OwnProps extends never
  ? [T] extends [React.FunctionComponent<any>]
    ? StyledMeta & T
    : StyledComponent<TrgProps>
  : StyledComponent<OwnProps & TrgProps>;

type StyledJSXIntrinsics = {
  readonly [P in keyof JSX.IntrinsicElements]: HtmlStyledTag<P>;
};

export type Styled = typeof styled & StyledJSXIntrinsics;

export default (process.env.NODE_ENV !== 'production'
  ? new Proxy(styled, {
      get(o, prop: keyof JSX.IntrinsicElements) {
        return o(prop);
      },
    })
  : styled) as Styled;
