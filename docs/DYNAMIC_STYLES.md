# Dynamic styles with `css` tag

Sometimes we have some styles based on component's props or state, or dynamic in some way. If you use the `styled(..)` helper with React, this is automatically handled using CSS custom properties. For `css` tags, we can use various approaches to tackle this. Each with their own limitations.

## Inline styles

Inline styles are the most straightforward way to use dynamic styles. Pass a `style` object with the dynamic styles, and you're done.

```js
import React from 'react';

export function Pager({ index, children }) {
  return (
    <div style={{ transform: `translateX(${index * 100}%)` }}>
      {children}
    </div>
  );
}
```

However, it's not possible to use inline styles with pseudo-selectors or media queries.

## CSS custom properties

[CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*) can be used to expose dynamic properties to the CSS.

```js
import React from 'react';
import { css, styles } from 'linaria';

const box = css`
  height: var(--box-size);
  width: var(--box-size);
`;

export function Box({ size }) {
  return (
    <div
      {...styles(box)}
      style={{ '--box-size': size }}
    />
  );
}
```

The [browser support for CSS custom properties](http://caniuse.com/#feat=css-variables) is limited, and it's not polyfilled. Therefore it's not a viable approach if you need to support older browsers. Worth noting that custom properties cascade, so if you don't override the value for the current element, and a custom property with the same name exists for a parent element, it'll be used instead.

## `currentColor`

For color values, browsers support a `currentColor` property which points to the text color of the element. It is well supported in all browsers.

```js
import React from 'react';
import { css, styles } from 'linaria';

const box = css`
  background-color: currentColor;
`;

const content = css`
  color: white;
`;

export function Box({ color }) {
  return (
    <div
      {...styles(box)}
      style={{ color }}
    >
      <span {...styles(content)}>
        ¯\_(ツ)_/¯
      </span>
    </div>
  );
}
```

You cannot use this approach if the dynamic value is not a color, or the element contains some text which needs to be styled with a different color. If the element has children, you will need to reset the `color` property for the text.
