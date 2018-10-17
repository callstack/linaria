/* @flow */

const React = require('react'); // eslint-disable-line import/no-extraneous-dependencies
const { cx } = require('../index');

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
      const { as: component = tag, class: className, ...rest } = props;

      rest.ref = ref;
      rest.className = cx(rest.className || className, options.class);

      const { vars } = options;

      if (vars) {
        const style = {};

        Object.keys(vars).forEach(name => {
          const [value, unit = ''] = vars[name];
          style[`--${name}`] = `${
            typeof value === 'function' ? value(props) : value
          }${unit}`;
        });

        rest.style = Object.assign(style, rest.style);
      }

      /* $FlowFixMe */
      if (typeof tag.className === 'string' && tag !== component) {
        // If the underlying tag is a styled component, forward the `as` prop
        // Otherwise the styles from the underlying component will be ignored
        return React.createElement(
          tag,
          Object.assign(rest, {
            as: component,
          })
        );
      }

      return React.createElement(component, rest);
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

type StyledJSXIntrinsics = $ObjMap<$JSXIntrinsics, <T>({ props: T }) => StyledTag<T>>;

declare module.exports: StyledJSXIntrinsics & {|
  <T>(T): StyledTag<React.ElementConfig<T>>,
|};
*/
