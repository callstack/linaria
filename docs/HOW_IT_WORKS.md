# How it works

Linaria consists of 2 parts:

1. Babel plugin
2. Webpack loader

## Babel plugin

The Babel plugin will look for `css` and `styled(..)` tags in your code and extract them out to a comment at the end of the file. It will also generate unique class names based on the hash of the filename.

When using the `styled(..)` tag, dynamic interpolations will be replaced with CSS custom properties. References to constants in the scope will also be inlined. If the same expression is used multiple times, the plugin will create a single CSS custom property for those.

If you've configured the plugin to evaluate expressions with `evaluate: true`, any dynamic expressions we encounter will be evaluated during the buildtime in a sandbox, and the result will be included in the CSS. Since these expressions are evaluated at build time in Node, you cannot use any browser specific APIs or any API which is only available in runtime. Access to Node native modules such as `fs` is also not allowed inside the sandbox to prevent malicious scripts. In addition, to achieve consistent build output, you should also avoid doing any side effects in these expressions and keep them pure.

The plugin will transpile this:

```js
import { styled } from 'linaria/react';
import { serif, regular } from './fonts';

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
import { styled } from 'linaria/react';
import { serif, regular } from './fonts';

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
CSS OUTPUT TEXT START

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

CSS OUTPUT TEXT END

CSS OUTPUT MAPPINGS:[{"generated":{"line":1,"column":0},"original":{"line":3,"column":6},"name":"Title_t1ugh8t9"},{"generated":{"line":5,"column":0},"original":{"line":7,"column":6},"name":"Container_c1ugh8t9"}]

CSS OUTPUT DEPENDENCIES:[]
*/
```

Here, we've left imported variables such as `serif` and `regular` as CSS custom properties. If you've passed, `evaluate: true` these will be resolved at build time and will be inlined in the CSS.

## Webpack loader

The webpack loader reads the comment output from the Babel plugin and writes it to a CSS file, which can be picked up by `css-loader` to generate the final CSS. It's also responsible for generating the sourcemap from the metadata from the Babel plugin.
