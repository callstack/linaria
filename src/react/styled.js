/* @flow */

const React = require('react'); // eslint-disable-line import/no-extraneous-dependencies

/* ::
type Options = {
  name: string,
  class: string,
  vars?: { [string]: [string | number | ((props: *) => string | number), string | void] }
}
*/

function styled(tag /* : React.ComponentType<*> | string */) {
  return (options /* : Options */) => {
    if (process.env.NODE_ENV !== 'production') {
      if (Array.isArray(options)) {
        // We received a strings array since it's used as a tag
        throw new Error(
          'Using the "styled" tag in runtime is not supported. Make sure you have set up the Babel plugin correctly.'
        );
      }
    }

    /* $FlowFixMe: Flow doesn't know about forwardRef */
    const Result = React.forwardRef((props, ref) => {
      const { as: component = tag, ...rest } = props;
      const next = Object.assign(rest, {
        ref,
        className: props.className
          ? `${options.class} ${props.className}`
          : options.class,
      });

      const { vars } = options;

      if (vars) {
        const style = {};

        Object.keys(vars).forEach(name => {
          const [value, unit = ''] = vars[name];
          style[`--${name}`] = `${
            typeof value === 'function' ? value(props) : value
          }${unit}`;
        });

        next.style = Object.assign(style, next.style);
      }

      return React.createElement(component, next);
    });

    Result.displayName = options.name;
    Result.className = options.class;
    Result.extends = tag;

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

/* ::
type StyledComponent<T> = React.ComponentType<T & { as?: React$ElementType }>;

type StyledTag<T> = (strings: string[], ...exprs: Array<string | number | {} | (T => string | number)>) => StyledComponent<T>;

declare module.exports: {|
  <T>(T): StyledTag<React.ElementConfig<T>>,
  [string]: StyledTag<{ children?: React.Node, [key: string]: any }>,
|};
*/
