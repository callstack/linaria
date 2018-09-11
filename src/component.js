import * as React from 'react';

export default function component(tag, options) {
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

  return Result;
}
