# linaria-styled

Zero-runtime CSS in JS library building React components (experimental).

## Features

- Familiar CSS syntax with Sass like nesting.
- CSS is extracted at build time, no runtime is included.
- Simple interpolations in the current scope are evaluated and inlined at build time.
- Expressions containing imported modules and utility functions can be optionally evaluated at build time.
- Dynamic runtime-based values are supported using CSS custom properties.
- Function interpolations receive props as the argument for dynamic prop based styling.
- Supports CSS sourcemaps, so you can easily find where the style was defined.

## Usage

Add the babel preset to your `.babelrc`:

```json
{
  "presets": [
    "@babel/preset-env",
    "@babel/preset-react"
    "linaria-styled/babel"
  ]
}
```

Make sure that `linaria-styled/babel` is the last item in your `presets` list.

Add the webpack loader to your `webpack.config.js`:

```js
module: {
  rules: [
    {
      test: /\.js$/,
      use: ['linaria-styled/loader', 'babel-loader'],
    },
    {
      test: /\.css$/,
      use: [MiniCssExtractPlugin.loader, 'css-loader'],
    },
  ],
},
```

Make sure that `linaria-styled/loader` is included before `babel-loader`.

## How it works

Linaria lets you write CSS code in a tagged template literal with a styled-component like syntax, using CSS custom properties for dynamic interpolations. The Babel plugin generates unique class names for the components and extracts the CSS to a comment in the JS file. Then the webpack loader extracts this comment out to real files.

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

const Title = styled.component('h1', {
  name: 'Title',
  class: 'Title_t1ugh8t9',
  vars: {
    't1ugh8t9-0-0': serif,
  },
});

const Container = styled.component('div', {
  name: 'Container',
  class: 'Container_c1ugh8t9',
  vars: {
    'c1ugh8t9-1-0': regular,
    'c1ugh8t9-1-2': props => props.color,
  },
});

/*
CSS OUTPUT START

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

CSS OUTPUT END

CSS MAPPINGS:[{"generated":{"line":1,"column":0},"original":{"line":3,"column":6},"name":"Title_t1ugh8t9"},{"generated":{"line":5,"column":0},"original":{"line":7,"column":6},"name":"Container_c1ugh8t9"}]
*/
```

## Limitations

- No IE support due to the use of CSS custom properties.

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

  Libraries like `styled-components` can get around the cascade because they can control the order of the CSS insertion during the runtime. It's not possible when statically extracting the CSS at build time.
