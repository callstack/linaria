# Basics

## Basic syntax

Linaria uses the [tagged template literal syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates) for defining styles. This is a new syntax introduced in the recent versions of JavaScript.

A template literal is a string wrapped between backticks (`` ` ``) instead of quotes. You can use multi-line strings and string interpolation with them.

```js
const message = `
This is a template literal.
This is an interpolation: ${answer}.
`;
```

A tagged template literal is a tag attached to a template literal:

```js
const message = someTag`This is a tagged template literal`;
```

Tags are normal JavaScript function that receive the template literal and its interpolations, and can perform operations before returning a value.

Linaria exposes 2 tags for styling, `css` and `styled`. They both support the same set of features, except prop based styles, which is only supported by the `styled` tag.

These tags let you write styles in CSS syntax inside the template literals.

### The `css` tag

The `css` tag allows you to create simple class names:

```js
import { css } from '@linaria/core';

// Create a class name
const title = css`
  font-size: 24px;
  font-weight: bold;
`;

function Heading() {
  // Pass it to a component
  return <h1 className={title}>This is a title</h1>;
}
```

Here the value of the `title` variable will be a unique class name which you can pass in the `className` prop. This code is equivalent to the following CSS and JavaScript.

CSS:

```css
.title {
  font-size: 24px;
  font-weight: bold;
}
```

JavaScript:

```js
function Heading() {
  return <h1 className="title">This is a title</h1>;
}
```

### The `styled` tag

The `styled` tag allows you to create a React component with some styles already applied.

You write `styled` followed by the name of the HTML tag you want to use, e.g. `styled.div`, `styled.a`, `styled.button`, `styled.h3` etc.

```js
import { styled } from '@linaria/react';

// Create a styled component
const Title = styled.h1`
  font-size: 24px;
  font-weight: bold;
`;

function Heading() {
  // Use the styled component
  return <Title>This is a title</Title>;
}
```

This reduces quite a bit of boilerplate code you had to write when you manually created the class name and applied it to a tag. This code is equivalent to the following CSS and JavaScript.

CSS:

```css
.title {
  font-size: 24px;
  font-weight: bold;
}
```

JavaScript:

```js
function Title(props) {
  return <h1 {...props} className="title" />;
}

function Heading() {
  return <Title>This is a title</Title>;
}
```

Apart from the reduced boilerplate code, this also makes it easier to do prop based styling which you'll cover later in the guide.

### Nesting, pseudo-elements and pseudo-selectors

You can nest selectors, pseudo-elements and pseudo-selectors similar to Sass, thanks to [stylis](https://github.com/thysultan/stylis.js).

For example, to change the color of a button on hover, you'll write something like this:

```js
const Button = styled.button`
  color: black;

  &:hover {
    color: blue;
  }
`;
```

The value of `&` refers to the class name. This code is equivalent to the following CSS:

```css
.button {
  color: black;
}

.button:hover {
  color: blue;
}
```

You can nest pseudo-elements as well as other selectors:

```js
const Thing = styled.div`
  color: black;

  &::after {
    /* .thing::after */
    content: '🌟';
  }

  h3 {
    /* .thing h3 */
    color: tomato;
  }

  .code {
    /* .thing .code */
    color: #555;
  }

  & + & {
    /* .thing + .thing */
    background: yellow;
  }

  &.bordered {
    /* .thing.bordered */
    border: 1px solid black;
  }

  .parent & {
    /* .parent .thing */
    color: blue;
  }
`;
```

You can also nest media queries:

```js
const Thing = styled.div`
  color: black;

  @media (min-width: 200px) {
    color: blue;
  }
`;
```

This is equivalent to the following CSS:

```css
.thing {
  color: black;
}

@media (min-width: 200px) {
  .thing {
    color: blue;
  }
}
```

### Keyframe animations

You can write keyframe declarations right inside the template literal:

```js
const Box = styled.div`
  height: 200px;
  width: 200px;
  background-color: tomato;
  animation: spin 2s linear infinite;

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }
`;
```

Here `spin` will be replaced with a unique string to scope the animation to the class name.

## Interpolations

Like normal template literals, you can interpolate other expressions inside a template literal tagged with `css` or `styled`.

If you try to interpolate an invalid value, you'll get an error at build-time.

### Basic interpolations

You can interpolate variables declared in the same file as well as imported variables:

```js
const fontSize = 16;

const Title = styled.h1`
  font-size: ${fontSize}px;
`;
```

Here, the `fontSize` variable will be evaluated at build time and inserted into the generated CSS.

You can also call functions while interpolating:

```js
const Button = styled.button`
  background-color: ${colors.primary};

  &:hover {
    background-color: ${darken(0.2, colors.primary)};
  }
`;
```

### Object interpolations

You can also interpolate object styles. It's converted to a CSS string before inserting to the stylesheet:

```js
const cover = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  opacity: 1,
  minHeight: 360,

  '@media (min-width: 200px)': {
    minHeight: 480,
  },
};

const Title = styled.h1`
  font-size: 24px;

  ${cover};
`;
```

This is equivalent to the following CSS:

```js
const Title = styled.h1`
  font-size: 24px;

  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  opacity: 1;
  min-height: 360px;

  @media (min-width: 200px): {
    min-height: 480px;
  }
`;
```

The interpolated object can have nested selectors, media queries, pseudo-selectors and pseudo-elements. Numeric values which require a unit (e.g. `minHeight` in the above example) will be appended with `px` unless specified.

### Prop based styles

When writing React components using the `styled` syntax, you can write styles based on the component's props. These values will use [CSS variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_variables) under the hood and can change dynamically in runtime.

For dynamic prop based styles, pass a function to the interpolation:

```js
const Title = styled.h1`
  color: ${props => (props.primary ? 'tomato' : 'black')};
`;
```

The function will be called with the component's props as an argument when it is rendered. Here, the color of the title will be automatically updated whenever the value of the `primary` prop changes.

### Referring to another component or class name

You can interpolate a styled component or a class name to refer to it. For example:

```js
const title = css`
  font-size: 24px;
  color: black;
`;

const Paragraph = styled.p`
  font-size: 16px;
  color: #555;
`;

const Article = styled.article`
  /* when referring to class names, prepend a dot (.) */
  .${title} {
    font-size: 36px;
  }

  /* when referring to a component, interpolate it as a selector */
  ${Paragraph} {
    font-size: 14px;
    margin: 16px;
  }
`;
```

## Overriding styles

If you want to override few styles on a styled component you defined earlier, you can do so by wrapping it in the `styled(..)` tag:

```js
const Button = styled.button`
  font-size: 14px;
  background-color: tomato;
  padding: 8px;
  box-shadow: 0 0.5px 0.3px rgba(0, 0, 0, 0.1);
`;

const LargeButton = styled(Button)`
  font-size: 18px;
  padding: 16px;
`;
```

Here, when you use `LargeButton`, it'll have all the same styles as `Button` except the `font-size` and `padding` which we overrode.

## Styling custom components

You can use the `styled(..)` tag to style any component as long as they accept a `className` and a `style` prop:

```js
function CoolComponent({ className, style, ...rest }) {
  return (
    <div className={className} style={style}>
      {...}
    </div>
  );
}

const StyledCoolComponent = styled(CoolComponent)`
  background-color: tomato;
`;
```

The `style` prop is necessary to apply CSS variables. If you're using a component library that doesn't support passing a `style` prop, you can wrap it in a `div` (or any other tag that makes sense) to apply it:

```js
import { Card } from 'some-library';

function CustomCard({ className, style, ...rest }) {
  return (
    <div style={style}>
      <Card className={className} {...rest} />
    </div>
  );
}

const StyledCustomCard = styled(CustomCard)`
  margin: 16px;
  height: ${props => props.height}px;
`;
```

If you want to use linaria classname, which is generated for component, you can get it as last item from `className` prop:

```js
function CoolComponent({ className, style, variant, ...rest }) {
  const allClasses = className.split(' ');
  const linariaClassName = allClasses[allClasses.length - 1];

  const classes = cx(
    className,
    variant === 'primary' && `${linariaClassName}--primary`
  );

  return (
    <div className={classes} style={style}>
      {...}
    </div>
  );
}

const StyledCoolComponent = styled(CoolComponent)`
  background-color: tomato;

  &--primary {
    background-color: yellow;
  }
`;
```

## Adding global styles

Normally, the styles are scoped to specific components. But sometimes you may need to write some global styles, for example, to normalize browser inconsistencies, define a font-family etc.

You can do the following to generate unscoped global styles:

```js
export const globals = css`
  :global() {
    html {
      box-sizing: border-box;
    }

    *,
    *:before,
    *:after {
      box-sizing: inherit;
    }

    @font-face {
      font-family: 'MaterialIcons';
      src: url(../assets/fonts/MaterialIcons.ttf) format('truetype');
    }
  }
`;
```

It's not possible to use dynamic prop based styles inside global styles.
