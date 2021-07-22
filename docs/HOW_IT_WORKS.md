# How it works

Linaria consists of 2 parts:

1. Babel plugin
2. Bundler integration

## Babel plugin

The Babel plugin will look for `css` and `styled` tags in your code, extract the CSS out and return it in the file's metadata. It will also generate unique class names based on the hash of the filename.

> To get a deep dive into Linaria babel plugin internals, check [debugging section of Contributing docs](../CONTRIBUTING.md#debugging-and-deep-dive-into-babel-plugin)

When using the `styled` tag, dynamic interpolations will be replaced with CSS custom properties. References to constants in the scope will also be inlined. If the same expression is used multiple times, the plugin will create a single CSS custom property for those.

The interpolations used for the CSS custom properties are left in the file, and are passed to the helper which creates the React components. Function interpolations receive the component's props and their return value will be used as the value for the CSS custom property. For other expressions, their result is used as is. If the resulting values aren't strings, they'll be converted to a string before setting the property. Inline styles are used to set the custom properties.

For example, the plugin will transpile this:

```js
import { styled } from '@linaria/react';
import { families, sizes } from './fonts';

const background = 'yellow';

const Title = styled.h1`
  font-family: ${families.serif};
`;

const Container = styled.div`
  font-size: ${sizes.medium}px;
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
import { styled } from '@linaria/react';
import { families, sizes } from './fonts';

const background = 'yellow';

const Title = styled('h1')({
  name: 'Title',
  class: 'Title_t1ugh8t',
  vars: {
    't1ugh8t9-0': [families.serif],
  },
});

const Container = styled('div')({
  name: 'Container',
  class: 'Container_c1ugh8t',
  vars: {
    'c1ugh8t9-0': [sizes.medium, 'px'],
    'c1ugh8t9-2': [props => props.color],
  },
});
```

The extracted CSS will look something like this:

```css
.Title_t1ugh8t9 {
  font-family: var(--t1ugh8t-0);
}

.Container_c1ugh8t9 {
  font-size: var(--c1ugh8t-0);
  background-color: yellow;
  color: var(--c1ugh8t-2);
  width: 33.333333333333336%;
  border: 1px solid red;
}

.Container_c1ugh8t9:hover {
  border-color: blue;
}
```

If we encounter a valid unit directly after the interpolation, it'll be passed to the helper so that the correct unit is used when setting the property. This allows you to write this:

```js
const Title = styled.h1`
  font-size: ${large}px;
`;
```

Instead of having to write this:

```js
const Title = styled.h1`
  font-size: ${large + 'px'};
`;
```

It's necessary since if we just replaced the interpolation as is, it wouldn't be a valid syntax:

```css
.Title_t1ugh8t9 {
  font-size: var(--t1ugh8t9-0-0)px; /* you can't have 'px' after the `var(..)` */
}
```

If we encounter a JS object when inlining, the JS object is assumed to be a style rule and converted to a CSS string before inlining it. For example, if you write this:

```js
const absoluteFill = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

const Container = styled.h1`
  background-color: papayawhip;

  ${Box} {
    ${absoluteFill}
  }
`;
```

It is equivalent to writing this:

```js
const Container = styled.h1`
  background-color: papayawhip;

  ${Box} {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
`;
```

We support this usage because it allows you to use a library such as [polished.js](https://polished.js.org) which outputs object based styles along with Linaria.

If you've configured the plugin to evaluate expressions with `evaluate: true` (default), any dynamic expressions we encounter will be evaluated during the build-time in a sandbox, and the result will be included in the CSS. Since these expressions are evaluated at build time in Node, you cannot use any browser specific APIs or any API which is only available in runtime. Access to Node native modules such as `fs` is also not allowed inside the sandbox to prevent malicious scripts. In addition, to achieve consistent build output, you should also avoid doing any side effects in these expressions and keep them pure.

You might want to skip evaluating a certain interpolation if you're using a browser API, a global variable which is only available at runtime, or a module which breaks when evaluating in the sandbox for some reason. To skip evaluating an interpolation, you can always wrap it in a function, like so:

```js
const Box = styled.h1`
  height: ${() => window.innerHeight * 2};
`;
```

But keep in mind that if you're doing SSR for your app, this won't work with SSR. In this particular case, better option will be to use the `calc` function along with the `vh` unit for the viewport height (e.g. `calc(100vh * 2)`).

### Evaluators

Linaria can use different strategies for evaluating the interpolated values.
Currently, we have two built-in strategies:

- `extractor` was the default strategy in `1.x` version. It takes an interpolated expression, finds all the referenced identifiers, gets all its declarations, repeats cycle for all identifiers in found declarations, and then constructs a new tree of statements from all found declarations. It's a pretty simple strategy, but it significantly changes an evaluated code and doesn't work for non-primitive js-constructions.
- `shaker` was introduced as an option in `1.4` and became the default in `2.0` version. In contrast to `extractor`, `shaker` tries to find all irrelevant code and cuts it out of the file. As a result, interpolated values can be defined without any restrictions.

If an interpolated value or one of its dependencies is imported from another module, that module will be also processed with an evaluator (the implementation of evaluator will be chosen by matching `rules` from [the Linaria config](./CONFIGURATION.md#options)).

Sometimes it can be useful to implement your own strategy (it can be just a mocked version of some heavy or browser-only library). You can do it by implementing `Evaluator` function:

```typescript
type Evaluator = (
  filename: string, // the name of processed file
  options: StrictOptions, // Linaria config
  text: string, // source code
  only: string[] | null // list of exported values or `null` for everything
) => [string, Map<string, string[]> | null];
```

The function should return an array with two elements: source code prepared for evaluation and `Map` with imported files in keys and list of the identifiers in values.

## Bundler integration

Plugins for bundlers such as webpack and Rollup use the Babel plugin internally and write the CSS text along with the sourcemap to a CSS file. The CSS file is then picked up and processed by the bundler (e.g. - `css-loader` in case of webpack) to generate the final CSS.
