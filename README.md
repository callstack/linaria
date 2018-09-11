# linaria-styled

Experimental Babel plugin to extract CSS statically from a components written with a styled-component like syntax. Uses CSS custom properties for interpolations.

The plugin will transpile this:

```js
const background = 'yellow';

const Container = styled('div')`
  font-family: ${serif};
  background-color: ${background};
  color: ${props => props.color};
  width: ${100 / 3}%;
  border: 1px solid red;

  &:hover {
    border-color: blue;
  }
`;
```

To this:

```js
const background = 'yellow';

const Container = component('div', {
  displayName: 'Container',
  className: 'Container_1ugh8t9',
  interpolations: {
    '1ugh8t9-0-0': serif,
    '1ugh8t9-0-2': props => props.color
  }
});

/*CSS OUTPUT START

.Container_1ugh8t9 {
  font-family: var(--1ugh8t9-0-0);
  background-color: yellow;
  color: var(--1ugh8t9-0-2);
  width: 33.333333333333336%;
  border: 1px solid red;
}

.Container_1ugh8t9:hover {
  border-color: blue;
}

CSS OUTPUT END*/
```

A separate tool such as a webpack loader can extract this comment to a separate CSS file.

## Features

- Statically evaluates interpolations in the current scope
- Dynamic runtime-based values are supported using CSS custom properties
- Function interpolations receive props as the argument for dynamic prop based styling
- Doesn't require any runtime, just a tiny helper to create the component

## Limitations

Due to the way it works, there are several limitations:

- The interpolations which cannot be statically evaluated are replaced with CSS custom properties. This means that they can only used in place of property values.

  This is valid, because `width` is defined in the current file and evaluated at build time:

  ```js
  const width = 200;

  const Component = styled('div')`
    @media (min-width: ${200}px) {
      display: block;
    }
  `;
  ```

  But this is invalid, because `width` is imported from another file and cannot be statically evaluated:

  ```js
  import { width } from './config';

  const Component = styled('div')`
    @media (min-width: ${200}px) {
      display: block;
    }
  `;
  ```

- The cascade is still there.

  For example, the following code can produce a div with `color: red;` or `color: blue;` depending on generated the order of CSS rules:

  ```js
  // First.js
  const First = styled('div')`
    color: blue;
  `;

  // Second.js
  import { First } from './First';

  const Second = styled(First)`
    color: red;
  `;
  ```

  Libraries like `styled-components` can get around the cascade because they can control the order of the CSS insertion during the runtime. We could probably generate additional metadata for the webpack loader to control the insertion order of the styles, but it's not possible right now.
