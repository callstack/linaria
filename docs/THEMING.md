# Theming

There are several approaches you can use for theming. Depending on the browser support and requirements, you can pick the approach that suits you the best.

## CSS custom properties

CSS custom properties aka CSS variables are one of the best ways to apply a theme to your web app. The basic concept is that we add a class name to represent the theme to our root element, and use different values for our CSS variables based on the theme:

```js
// Create class names for different themes
const a = css`
  --color-primary: #6200ee;
  --color-accent: #03dac4;
`;

const b = css`
  --color-primary: #03a9f4;
  --color-accent: #e91e63;
`;

// Apply a theme to the root element
<Container className={a} />;
```

Now, we can use these variables in any of the child elements:

```js
const Button = styled.button`
  background-color: var(--color-accent);
`;
```

CSS custom properties are [not supported in some browsers such as IE](http://caniuse.com/#feat=css-variables), so if you need to support those browsers, this is not a viable approach.

## Class names

Another approach is to add a class name representing the theme (e.g. - `theme-dark`) in the root element, and take advantage of CSS child selectors to theme the elements based on this parent class name.

For example, let's add the theme to the root component:

```js
<Container className="theme-dark" />
```

Now, we can conditionally style any child element according to the theme:

```js
const Header = styled.h1`
  text-transform: uppercase;

  .theme-dark & {
    color: white;
  }

  .theme-light & {
    color: black;
  }
`;
```

You could even make some helpers to make writing this easier:

```js
// Put your colors in an object grouped by the theme names
const colors = {
  light: {
    text: 'black',
  },
  dark: {
    text: 'white',
  },
};

// Create a small helper function to loop over the themes and create CSS rule sets
const theming = cb =>
  Object.keys(colors).reduce((acc, name) => Object.assign(acc, {
    [`.theme-${name} &`]: cb(colors[name]),
  }), {});

// Use the helper in your styles
const Header = styled.h1`
  text-transform: uppercase;

  ${theming(c => ({
    color: c.text,
  }))};
`;
```

This approach works in all browsers, and is the best approach if you want to support older browsers without support for CSS custom properties.

## React Context

Another approach is to use React Context to pass down colors, and then use function interpolations with the `styled` tag to use the colors in your component. You could use something like [`@callstack/react-theme-provider`](https://github.com/callstack/react-theme-provider) or write your own HOC. Then use it like:

```js
const Button = withTheme(styled.button`
  background-color: ${props => props.theme.accent};
`);
```

Note that this approach also uses CSS custom properties under the hood since function interpolations compile down to CSS custom properties. So the browser support is limited.
