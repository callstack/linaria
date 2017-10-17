# Jest utilities for Linaria

A set of utilities for more delightful testing of Linaria–enhanced code with Jest.

## API
* `reactSerializer` – React snapshot serializer
* `preactSerializer` – Preact snapshot serializer

## Snapshot serializers

One of the most helpful utilities for CSS in JS libraries are [snapshot serialiers](http://facebook.github.io/jest/docs/en/expect.html#expectaddsnapshotserializerserializer), which are able to colocate styles with JS code. Linaria provides serializers for React and Preact components by default.

### Usage
Use it directly in your test file, or in `setupFiles`:
```js
import { reactSerializer } from 'linaria/jest';

expect.addSnapshotSerializer(reactSerializer);
```

### Example

Here's a component we want to snapshot:
```jsx
import React from 'react';
import { css, names } from 'linaria';
import theme from '../theme';

export default function Container({ children, className }) {
  return <div className={names(container, className)}>{children}</div>;
}

const container = css`
  max-width: 900px;

  &:hover {
    background: ${theme.hover};
  }
`;
```
We write a test (provided that our serializer is added in `setupFiles`):
```jsx
import React from 'react';
import { css } from 'linaria';

test('my pretty Container', () => {
  const tree = renderer.create(
    <Container className={css`flex: 1;`}>text</Container>;
  );

  expect(tree).toMatchSnapshot();
});
```

...and the output snapshot with serializer applied is:
```js
// Jest Snapshot v1, https://goo.gl/fbAQLP

exports[`my pretty Container 1`] = `
.a0 {
  max-width: 900px;
}
.a0:hover {
  background: #fff;
}
.a1 {
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
}

<div
  className="a0 a1"
>
  text
</div>
`
```
