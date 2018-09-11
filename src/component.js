import * as React from 'react';

export default function component(
  tag,
  { displayName, className, interpolations }
) {
  const Result = function(props) {
    const next = Object.assign({}, props, {
      className: props.className
        ? `${className} ${props.className}`
        : className,
    });

    if (interpolations) {
      const style = {};

      Object.keys(interpolations).forEach(name => {
        const value = interpolations[name];
        style[`--${name}`] = typeof value === 'function' ? value(props) : value;
      });

      next.style = Object.assign(style, next.style);
    }

    return React.createElement(tag, next);
  };

  Result.displayName = displayName;

  return Result;
}
