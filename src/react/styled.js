/* @flow */

const React = require('react'); // eslint-disable-line import/no-extraneous-dependencies
const { default: validAttr } = require('@emotion/is-prop-valid');
const { cx } = require('../index');

type Options = {
  name: string,
  class: string,
  vars?: {
    [string]: [
      string | number | ((props: *) => string | number),
      string | void,
    ],
  },
};

const warnIfInvalid = (value: any, componentName) => {
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
      `An inteprolation evaluated to '${stringified}' in the component '${componentName}', which is probably a mistake. You should explicitly cast or transform the value to a string.`
    );
  }
};

function styled(tag: React.ComponentType<*> | string) {
  return (options: Options) => {
    if (process.env.NODE_ENV !== 'production') {
      if (Array.isArray(options)) {
        // We received a strings array since it's used as a tag
        throw new Error(
          'Using the "styled" tag in runtime is not supported. Make sure you have set up the Babel plugin correctly. See https://github.com/callstack/linaria#setup'
        );
      }
    }

    const render = (props, ref) => {
      const { as: component = tag, class: className, ...rest } = props;

      let filteredProps;

      // Check if it's an HTML tag and not a custom element
      if (typeof component === 'string' && component.indexOf('-') === -1) {
        filteredProps = {};

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
        const style = {};

        // eslint-disable-next-line guard-for-in
        for (const name in vars) {
          const [result, unit = ''] = vars[name];
          const value = typeof result === 'function' ? result(props) : result;

          warnIfInvalid(value, options.name);

          style[`--${name}`] = `${value}${unit}`;
        }

        filteredProps.style = Object.assign(style, filteredProps.style);
      }

      /* $FlowFixMe */
      if (tag.__linaria && tag !== component) {
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
        ({ innerRef, ...rest }) => render(rest, innerRef);

    Result.displayName = options.name;

    // These properties will be read by the babel plugin for interpolation
    /* $FlowFixMe */
    Result.__linaria = {
      className: options.class,
      extends: tag,
    };

    return Result;
  };
}

if (process.env.NODE_ENV !== 'production') {
  module.exports = new Proxy(styled, {
    get(o, prop) {
      return o(prop);
    },
  });
} else {
  module.exports = styled;
}

type CSSProperties = {
  [key: string]: string | number | CSSProperties,
};

type StyledComponent<T> = React.ComponentType<T & { as?: React$ElementType }>;

type StyledTag<T> = (
  strings: string[],
  ...exprs: Array<string | number | CSSProperties | (T => string | number)>
) => StyledComponent<T>;

type StyledJSXIntrinsics = $ObjMap<
  $JSXIntrinsics,
  () => StyledTag<{ children?: React$Node, [key: string]: any }>
>;

declare module.exports: StyledJSXIntrinsics & {|
  <T>(T): StyledTag<React.ElementConfig<T>>,
|};
