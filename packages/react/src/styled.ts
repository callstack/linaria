/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * This file contains an runtime version of `styled` component. Responsibilities of the component are:
 * - returns ReactElement based on HTML tag used with `styled` or custom React Component
 * - injects classNames for the returned component
 * - injects CSS variables used to define dynamic styles based on props
 */
import validAttr from '@emotion/is-prop-valid';
import React from 'react';

import { cx } from '@linaria/core';
import type { CSSProperties } from '@linaria/core';
import type { StyledMeta } from '@linaria/utils';

export type NoInfer<A> = [A][A extends any ? 0 : never];

type Component<TProps> =
  | ((props: TProps) => unknown)
  | { new (props: TProps): unknown };

type Has<T, TObj> = [T] extends [TObj] ? T : T & TObj;

type Options = {
  atomic?: boolean;
  class: string;
  name: string;
  propsAsIs: boolean;
  vars?: {
    [key: string]: [
      string | number | ((props: unknown) => string | number),
      string | void
    ];
  };
};

const isCapital = (ch: string): boolean => ch.toUpperCase() === ch;
const filterKey =
  <TExclude extends keyof any>(keys: TExclude[]) =>
  <TAll extends keyof any>(key: TAll): key is Exclude<TAll, TExclude> =>
    keys.indexOf(key as any) === -1;

export const omit = <T extends Record<string, unknown>, TKeys extends keyof T>(
  obj: T,
  keys: TKeys[]
): Omit<T, TKeys> => {
  const res = {} as Omit<T, TKeys>;
  Object.keys(obj)
    .filter(filterKey(keys))
    .forEach((key) => {
      res[key] = obj[key];
    });

  return res;
};

function filterProps<T extends Record<string, unknown>, TKeys extends keyof T>(
  asIs: boolean,
  props: T,
  omitKeys: TKeys[]
): Partial<Omit<T, TKeys>> {
  const filteredProps = omit(props, omitKeys) as Partial<T>;

  if (!asIs) {
    /**
     * A failsafe check for esModule import issues
     * if validAttr !== 'function' then it is an object of { default: Fn }
     */
    const interopValidAttr =
      typeof validAttr === 'function' ? { default: validAttr } : validAttr;

    Object.keys(filteredProps).forEach((key) => {
      if (!interopValidAttr.default(key)) {
        // Don't pass through invalid attributes to HTML elements
        delete filteredProps[key];
      }
    });
  }

  return filteredProps;
}

const warnIfInvalid = (value: unknown, componentName: string) => {
  if (process.env.NODE_ENV !== 'production') {
    if (
      typeof value === 'string' ||
      // eslint-disable-next-line no-self-compare,no-restricted-globals
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

let idx = 0;

// Components with props are not allowed
function styled(
  componentWithStyle: () => any
): (error: 'The target component should have a className prop') => void;
// Property-based interpolation is allowed only if `style` property exists
function styled<
  TProps extends Has<TMustHave, { style?: React.CSSProperties }>,
  TMustHave extends { style?: React.CSSProperties },
  TConstructor extends Component<TProps>
>(
  componentWithStyle: TConstructor & Component<TProps>
): ComponentStyledTagWithInterpolation<TProps, TConstructor>;
// If styled wraps custom component, that component should have className property
function styled<
  TProps extends Has<TMustHave, { className?: string }>,
  TMustHave extends { className?: string },
  TConstructor extends Component<TProps>
>(
  componentWithoutStyle: TConstructor & Component<TProps>
): ComponentStyledTagWithoutInterpolation<TConstructor>;
function styled<TName extends keyof JSX.IntrinsicElements>(
  tag: TName
): HtmlStyledTag<TName>;
function styled(
  component: 'The target component should have a className prop'
): never;
function styled(tag: any): any {
  let mockedClass = '';

  if (process.env.NODE_ENV === 'test') {
    // eslint-disable-next-line no-plusplus
    mockedClass += `mocked-styled-${idx++}`;
    if (tag?.__linaria?.className) {
      mockedClass += ` ${tag.__linaria.className}`;
    }
  }

  return (options: Options) => {
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.NODE_ENV !== 'test'
    ) {
      if (Array.isArray(options)) {
        // We received a strings array since it's used as a tag
        throw new Error(
          'Using the "styled" tag in runtime is not supported. Make sure you have set up the Babel plugin correctly. See https://github.com/callstack/linaria#setup'
        );
      }
    }

    const render = (props: any, ref: any) => {
      const { as: component = tag, class: className = mockedClass } = props;
      const shouldKeepProps =
        options.propsAsIs === undefined
          ? !(
              typeof component === 'string' &&
              component.indexOf('-') === -1 &&
              !isCapital(component[0])
            )
          : options.propsAsIs;
      const filteredProps: IProps = filterProps(shouldKeepProps, props, [
        'as',
        'class',
      ]);

      filteredProps.ref = ref;
      filteredProps.className = options.atomic
        ? cx(options.class, filteredProps.className || className)
        : cx(filteredProps.className || className, options.class);

      const { vars } = options;

      if (vars) {
        const style: Record<string, string> = {};

        // eslint-disable-next-line guard-for-in,no-restricted-syntax
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
          const rest = omit(props, ['innerRef']);
          return render(rest, props.innerRef);
        };

    (Result as any).displayName = options.name;

    // These properties will be read by the babel plugin for interpolation
    (Result as any).__linaria = {
      className: options.class || mockedClass,
      extends: tag,
    };

    return Result;
  };
}

export type StyledComponent<T> = StyledMeta &
  ([T] extends [React.FunctionComponent<any>]
    ? T
    : React.FunctionComponent<T & { as?: React.ElementType }>);

type StaticPlaceholder = string | number | CSSProperties | StyledMeta;

export type HtmlStyledTag<TName extends keyof JSX.IntrinsicElements> = <
  TAdditionalProps = Record<never, unknown>
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

type ComponentStyledTagWithoutInterpolation<TOrigCmp> = (
  strings: TemplateStringsArray,
  ...exprs: Array<
    | StaticPlaceholder
    | ((props: 'The target component should have a style prop') => never)
  >
) => StyledMeta & TOrigCmp;

// eslint-disable-next-line @typescript-eslint/ban-types
type ComponentStyledTagWithInterpolation<TTrgProps, TOrigCmp> = <OwnProps = {}>(
  strings: TemplateStringsArray,
  ...exprs: Array<
    | StaticPlaceholder
    | ((props: NoInfer<OwnProps & TTrgProps>) => string | number)
  >
) => keyof OwnProps extends never
  ? StyledMeta & TOrigCmp
  : StyledComponent<OwnProps & TTrgProps>;

export type StyledJSXIntrinsics = {
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
