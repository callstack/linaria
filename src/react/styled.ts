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
  mod?: {
    [key: string]: (props: unknown) => string | number | boolean;
  };
  f?: (propsToFilter: any) => any;
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

      const { vars, mod, f } = options;

      if (f) {
        filteredProps = f(filteredProps);
      }

      let modifiers = [];
      if (mod) {
        for (const name in mod) {
          const result = mod[name](props);
          result && modifiers.push(name);
        }
      }

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

      filteredProps.ref = ref;
      filteredProps.className = cx(
        filteredProps.className || className,
        options.class,
        ...modifiers
      );

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

/**
 * @desc Utility type for getting props type of React component.
 */
export type PropsOf<
  Tag extends React.ComponentType<any>
> = Tag extends React.SFC<infer Props>
  ? Props & React.Attributes
  : Tag extends React.ComponentClass<infer Props>
  ? (Tag extends new (...args: Array<any>) => infer Instance
      ? Props & React.ClassAttributes<Instance>
      : never)
  : never;

type AsProp = { as?: React.ElementType };

export type CSSProperties = {
  [key: string]: string | number | CSSProperties;
};

/**
 * _isStyled is a private type to validate that selectors are Styled Components.
 * This is required to ensure extra properties are not attached to StyledComponents that style others:
 * ``const Dialog = styled.div` ${Button} { color: red; } ``
 * Without the _isStyled type, Button's properties could appear on Dialog which would be incorrect.
 */
type _isStyled = { __linaria: true };

export type StyledComponent<Tag, ExtraProps> = React.FunctionComponent<
  GetProps<Tag> & AsProp & ExtraProps
> &
  _isStyled;

interface Filter<T> {
  filterProps: {
    (initial: T): Partial<T>;
  };
}

// The tagged template function
type StyledTag<Tag> = <ExtraProps = {}>(
  strings: TemplateStringsArray,
  ...exprs: Array<
    | string
    | number
    | CSSProperties
    | StyledComponent<any, any>
    // Strictly typing props argument would break the generated StyledComponent.
    | ((props: any) => string | number)
    | [unknown] // Modifier selectors
    | Filter<GetProps<Tag> & ExtraProps>
  >
) => StyledComponent<Tag, ExtraProps>;

type JSXInEl = JSX.IntrinsicElements;

type GetProps<T> = T extends keyof JSXInEl
  ? JSXInEl[T]
  : T extends React.ComponentType<any>
  ? PropsOf<T>
  : {};

// The main styled constructor function
export type CreateStyled = {
  readonly [key in keyof JSXInEl]: StyledTag<key>
} & {
  <Tag extends keyof JSXInEl>(tag: Tag): StyledTag<Tag>;
  <Tag extends React.ComponentType<any>>(tag: Tag): StyledTag<Tag>;
};

export default ((process.env.NODE_ENV !== 'production'
  ? new Proxy(styled, {
      get(o, prop) {
        prop = typeof prop === 'number' ? prop.toString() : prop;
        prop = typeof prop === 'symbol' ? prop.toString() : prop;
        return o(prop);
      },
    })
  : styled) as any) as CreateStyled;
