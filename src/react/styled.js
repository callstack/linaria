const React = require('react'); // eslint-disable-line import/no-extraneous-dependencies

function styled(tag) {
  return options => {
    if (process.env.NODE_ENV !== 'production') {
      if (Array.isArray(options)) {
        // We received a strings array since it's used as a tag
        throw new Error(
          'Using the "styled" tag in runtime is not supported. Make sure you have set up the Babel plugin correctly.'
        );
      }
    }

    const Result = React.forwardRef((props, ref) => {
      const next = Object.assign({}, props, {
        ref,
        className: props.className
          ? `${options.class} ${props.className}`
          : options.class,
      });

      if (options.vars) {
        const style = {};

        Object.keys(options.vars).forEach(name => {
          const [value, unit = ''] = options.vars[name];
          style[`--${name}`] = `${
            typeof value === 'function' ? value(props) : value
          }${unit}`;
        });

        next.style = Object.assign(style, next.style);
      }

      return React.createElement(tag, next);
    });

    Result.displayName = options.name;
    Result.className = options.class;

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
