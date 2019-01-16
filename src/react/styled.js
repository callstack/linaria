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

function styled(tag: React.ComponentType<*> | string) {
  return (options: Options) => {
    if (process.env.NODE_ENV !== 'production') {
      if (Array.isArray(options)) {
        // We received a strings array since it's used as a tag
        throw new Error(
          'Using the "styled" tag in runtime is not supported. Make sure you have set up the Babel plugin correctly.'
        );
      }
    }

    const Result = React.forwardRef((props, ref) => {
      const { as: component = tag, class: className, ...rest } = props;

      let filteredProps;

      if (typeof tag === 'string') {
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

        Object.keys(vars).forEach(name => {
          const [value, unit = ''] = vars[name];
          style[`--${name}`] = `${
            typeof value === 'function' ? value(props) : value
          }${unit}`;
        });

        filteredProps.style = Object.assign(style, filteredProps.style);
      }

      /* $FlowFixMe */
      if (tag.__linaria && tag !== component) {
        // If the underlying tag is a styled component, forward the `as` prop
        // Otherwise the styles from the underlying component will be ignored
        return React.createElement(
          tag,
          Object.assign(filteredProps, {
            as: component,
          })
        );
      }

      return React.createElement(component, filteredProps);
    });

    Result.displayName = options.name;

    // This properties will be read by the babel plugin for interpolation
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
