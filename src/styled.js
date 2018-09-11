const React = require('react');

function styled() {
  throw new Error(
    'Calling "styled" in runtime is not supported. Make sure you have set up the Babel plugin correctly.'
  );
}

styled.component = (tag, options) => {
  const Result = function(props) {
    const next = Object.assign({}, props, {
      className: props.className
        ? `${options.class} ${props.className}`
        : options.class,
    });

    if (options.vars) {
      const style = {};

      Object.keys(options.vars).forEach(name => {
        const value = options.vars[name];
        style[`--${name}`] = typeof value === 'function' ? value(props) : value;
      });

      next.style = Object.assign(style, next.style);
    }

    return React.createElement(tag, next);
  };

  Result.displayName = options.name;
  Result.className = options.class;

  return Result;
};

module.exports = styled;
