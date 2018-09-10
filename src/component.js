import * as React from 'react';

export default function component(
  tag,
  { displayName, className, interpolations }
) {
  const Result = function(props) {
    const next = { className };

    if (interpolations) {
      const style = {};

      Object.keys(interpolations).forEach(name => {
        const value = interpolations[name];
        style[`--${name}`] = typeof value === 'function' ? value(props) : value;
      });
    }

    return React.createElement(tag, next);
  };

  Result.displayName = displayName;

  return Result;
}
