# API

Linaria exposes a core `css` method alongside with small, but just enough amount of helpers. Inside `linaria` module you can find following methods:

## Client APIs

### `css`

String tag for tagged template literals consisting CSS code. The tagged template literal is evaluated to a unique class name by the Babel plugin:

```js
import { css } from 'linaria';

const flower = css`
  display: inline;
  color: violet,
`;

// flower === flower__9o5awv –> with babel plugin
```

All rules inside the template literal are scoped to the class name, including media queries and animations. For example, we can declare CSS animation like so:

```js
import { css } from 'linaria';

const box = css`
  animation: rotate 1s linear infinite;

  @keyframes rotate {
    { from: 0deg }
    { to: 360deg }
  }
`;
```

### `names(...classNames: string[]) => string`

Takes a list of class names and returns a concatenated string with the class names. Falsy values are ignored.

```js
import { css, names } from 'linaria';

const cat = css`
  font-weight: bold;
`;

const yarn = css`
  color: violet;
`;

const fun = css`
  display: flex;
`;

function App({ isPlaying }) {
  return <Playground className={names(cat, yarn, isPlaying && fun)} />;
}
```

### `styles(...classNames: string[]) => { className: string }`

Similar to `names`, but it also lets you write less code thanks to object destructuring.

```js
import { css, styles } from 'linaria';

const container = css`
  max-width: 1337px;
`;

export function Block({ className }) {
  return <div {...styles(container, className)} />;
}
```

### `styled`

Helper to build React components:

```js
import { styled } from 'linaria/react';
import colors from './colors.json';

const Container = styled('div')`
  background-color: ${colors.background};
  color: ${props => props.color};
  width: ${100 / 3}%;
  border: 1px solid red;

  &:hover {
    border-color: blue;
  }
`;
```

All rules inside the template literal are scoped to the component, similar to the `css` tag.

Dynamic interpolations are replaced with CSS custom properties. A dynamic function interpolation will receive the `props` of the component as it's arguments and the returned result will be used as the value for the variable. When using this, a tiny helper is imported so that we don't duplicate the code for creating the component in all files.

If you have configured the babel plugin with `evaluate: true`, you can also interpolate a component to refer to it:

```js
const Title = styled('h1')`
  font-size: 36px;
`;

const Article = styled('article')`
  font-size: 16px;

  ${Title} {
    margin-bottom: 24px;
  }
`;
```

## Server APIs (`linaria/server`)

### `collect(html: string, css: string) => string`

Takes HTML and CSS strings and returns the critical CSS used in the page by analyzing the class names. It can be used to detrmine critical CSS for server side rendering.

```js
import { collect } from 'linaria/server';

const css = fs.readFileSync('./dist/styles.css', 'utf8');
const html = ReactDOMServer.renderToString(<App />);
const { critical, other } = collect(html, css);

// critical – returns critical CSS for given html
// other – returns the rest of styles
```
