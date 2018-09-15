# Theming

CSS already has a nice theming support which we can leverage by using child selectors. The basic concept is that we add a class name to represent the theme (e.g. - `theme-dark`) to our root element, and take advantage of CSS child selectors to theme the elements based on this parent class name.

For example, let's add the theme to the root component:

```js
export default function App() {
  return <Container className='theme-dark' />;
}
```

Now, we can conditionally style any child element according to the theme:

```js
import React from 'react';
import { css } from 'linaria';
import colors from './colors';

const header = css`
  text-transform: uppercase;

  .theme-dark & { color: ${colors.white} }

  .theme-light & { color: ${colors.black} }
`;

export default function Header({ title }) {
  return <h1 className={header}>{title}</h1>;
}
```
