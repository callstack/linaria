# linaria-styled

Experimental Babel plugin to extract CSS statically from a components written with a styled-component like syntax. Uses CSS custom properties for interpolations.

The plugin will transpile this:

```js
const background = 'yellow';

const Title = styled('h1')`
  font-family: ${serif};
`;

const Container = styled('div')`
  font-family: ${regular};
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

const Title = component('h1', {
  name: 'Title',
  class: 'Title_t1ugh8t9',
  vars: {
    't1ugh8t9-0-0': serif,
  },
});

const Container = component('div', {
  name: 'Container',
  class: 'Container_c1ugh8t9',
  vars: {
    'c1ugh8t9-1-0': regular,
    'c1ugh8t9-1-2': props => props.color,
  },
});

/*CSS OUTPUT START

.Title_t1ugh8t9 {
  font-family: var(--t1ugh8t9-0-0);
}

.Container_c1ugh8t9 {
  font-family: var(--c1ugh8t9-1-0);
  background-color: yellow;
  color: var(--c1ugh8t9-1-2);
  width: 33.333333333333336%;
  border: 1px solid red;
}

.Container_c1ugh8t9:hover {
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
