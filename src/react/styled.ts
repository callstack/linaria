import React from 'react'; // eslint-disable-line import/no-extraneous-dependencies
import validAttr from '@emotion/is-prop-valid';
import { cx } from '../index';

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

// TODO: improve types
function styled(tag: React.ComponentType<any> | string) {
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

type StyledComponent<T> = React.FunctionComponent<
  T & { as?: React.ElementType }
>;

type StyledTag<T> = <Props = T>(
  strings: TemplateStringsArray,
  ...exprs: Array<
    string | number | CSSProperties | ((props: Props) => string | number)
  >
) => StyledComponent<Props>;

type StyledJSXIntrinsics = {
  readonly [P in keyof JSX.IntrinsicElements]: StyledTag<
    JSX.IntrinsicElements[P]
  >
};

type Styled = StyledJSXIntrinsics & {
  <T>(component: React.ElementType<T>): StyledTag<T>;

  readonly [key: string]: StyledTag<{
    children?: React.ReactNode;
    [key: string]: any;
  }>;
};

export default ((process.env.NODE_ENV !== 'production'
  ? new Proxy(styled, {
      get(o, prop) {
        prop = typeof prop === 'number' ? prop.toString() : prop;
        prop = typeof prop === 'symbol' ? prop.toString() : prop;
        return o(prop);
      },
    })
  : styled) as any) as Styled;
