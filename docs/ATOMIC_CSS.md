# Atomic CSS

## What is Atomic CSS?

Atomic CSS is an approach to styling that reduces payload sizes for style delivery, and allows style composition and reuse easily. This document describes the concept of Atomic CSS, its advantage and use cases.

Atomic CSS is a way of writing CSS such that each CSS rule has exactly one declaration (an "atom"). For example,

```css
/** A normal class */
.myClass {
  background: red;
  width: 100%;
  height: 100%;
}

/** Can be written atomically as: */
.a {
  background: red;
}
.b {
  width: 100%;
}
.c {
  height: 100%;
}
```

## Usage in Linaria

Atomic styles can be enabled in the linaria config by providing an `atomizer` function (see [configuration](./CONFIGURATION.md) for details).

Once enabled, it is possible to write atomic styles by importing the `css` template literal from `@linaria/atomic`:

```tsx
import { cx } from '@linaria/core';
import { css } from '@linaria/atomic';

const atomicCss = css`
  background: red;
  width: 100%;
  height: 100%;
  border: 1px solid black;
`;

const blueBackground = css`
  background: blue;
  border: 1px solid black;
`;

// In React:
<div className={cx(atomicCss, blueBackground)} />;

// In vanilla JS:
const div = document.createElement('div');
div.setAttribute('class', cx(atomicCss, blueBackground));
document.body.appendChild(div);
```

Which at build time, is transformed into:

```ts
import { cx } from '@linaria/core';
import { css } from '@linaria/atomic';

const atomicCss = {
  background: 'atm_abcd',
  width: 'atm_efgh',
  background: 'atm_ijkl',
  border: 'atm_mnop',
};

const blueBackground = {
  background: 'atm_qrst',
  // Note that the class name for border is the same in both – this is because it's the same property + value pair, so it's the same atom
  border: 'atm_mnop',
};

// In React:
<div className={cx(atomicCss, blueBackground)} />;

// In vanilla JS:
const div = document.createElement('div');
div.setAttribute('class', cx(atomicCss, blueBackground));
document.body.appendChild(div);
```

### at-rules, pseudo classes and keyframes

Linaria's atomic css also supports creating (nested) at-rules, psuedo classes and keyframes:

```ts
import { css } from '@linaria/atomic';

// Note: animation name namespacing does not happen automatically with @linaria/atomic. Keyframe animations are pulled out to the top level and not atomized.
export const animation = css`
  @keyframes my-animation {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  animation: my-animation 1s infinite;
`;

export const pseudoClass = css`
  &:hover {
    color: pink;
  }
`;

export const mediaQuery = css`
  @media (max-width: 400px) {
    background: orange;
  }
`;
```

These can also be combined for further nesting.

## Use cases

### Reducing number of rules

One advantage of writing styles in this way is that we can reuse CSS more effectively. In many cases, declarations are repeated in CSS, and atomic CSS allows heavy reuse of these classes. For example if we have the classes,

```html
<style>
  .redButton {
    background: red;
    width: 100px;
  }

  .blueButton {
    background: blue;
    width: 100px;
  }
</style>
<button class="redButton" />
<button class="blueButton" />
```

We've repeated the declaration `width: 100px` twice. This repetition can become heavy as the amount of rules increases. Atomically, this can be written as:

```html
<style>
  .a {
    background: red;
  }
  .b {
    background: blue;
  }
  .c {
    width: 100px;
  }
</style>
<button class="a c" />
<button class="b c" />
```

### Application order precedence vs. Definition order precedence

Another advantage is that rule precedence can be managed upon _application_ to an element rather than in the declaration. Consider a React component that passes a class name through a prop:

```ts
// BaseComponent.js
import { cx, css } from '@linaria/core';
const myClass = css`
  background: red;
`;

export default function BaseComponent({ overrideClass }) {
  return <div className={cx(myClass, overrideClass)} />;
}

// OverrideComponent.js
import { cx, css } from '@linaria/core';
import BaseComponent from './BaseComponent';

const overrides = css`
  background: blue;
`;

function OverrideComponent({ overrideClass }) {
  return <BaseComponent overrideClass={overrideClass} />;
}
```

The expectation would be that `background: blue` should be the result for `OverrideComponent`, but the result depends on the ordering of the compiled output in the DOM:

```ts
// dist/BaseComponent.js
import { cx, css } from '@linaria/core';
const myClass = 'myClass';

export default function BaseComponent({ overrideClass }) {
  return <div className={cx(myClass, overrideClass)} />;
}

// dist/BaseComponent.css
.myClass {
    background: red;
}

// dist/OverrideComponent.js
import { cx, css } from '@linaria/core';
import BaseComponent from './BaseComponent';

const overrides = 'overrides';

function OverrideComponent({ overrideClass }) {
  return <BaseComponent overrideClass={overrideClass} />;
}

// dist/BaseComponent.css
.overrides {
    background: blue;
}
```

Since `.overrides` and `.myClass` have the same specificity, the ultimate result of which component has precedence depends on their ordering in the DOM. This may be stable, but for async components, it may produce race conditions in styling.

With atomic styles, the precedence can be managed upon application – `cx` has the ability to look at the classes it is provided with, and filter duplicates. This means that there should never be rules with the same precedence applied to the same element.

Note that this example uses React, but is not a unique problem to react – it applies to any files that deliver bundles split between different files, where the ordering (and ultimate winner in specificity) may be nondeterministic at runtime.

### Limitations

- `@linaria/atomic` does not support targeting child selectors in css
- Shorthand properties like background are discouraged, as conflicts may still occur between properties like `border` and `border-top`
- Usage of `cx` is required to correctly deduplicate atoms, to ensure the application order precedence is guaranteed.

## See also

- [style9](https://github.com/johanholmerin/style9) using atomic styles
- Introduction of stylex: [conference talk video](https://www.youtube.com/watch?v=9JZHodNR184&t=229s)
