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

const atomicCss =
  'atm_background_abcd atm_width_efgh atm_height_ijkl atm_border_mnop';

const blueBackground = 'atm_background_qrst atm_border_mnop';

// In React:
<div className={cx(atomicCss, blueBackground)} />; // <div class="atm_width_efgh atm_height_ijkl atm_border_mnop" atm_background_qrst />

// In vanilla JS:
const div = document.createElement('div');
div.setAttribute('class', cx(atomicCss, blueBackground)); // same as React example
document.body.appendChild(div);
```

(Note: in the example above, the slugs in the atoms are lengthened for readability)

The format of these atoms is `atm_${propertySlug}_${valueSlug}` which lets us deduplicate based on the `propertySlug` part of the atom.

As you can see in the above example, `atm_border_mnop` can be removed as it duplicated, and we see two atoms with the `background` property slug, and can remove one of them.

### at-rules, pseudo classes and keyframes

Linaria's atomic css also supports creating (nested) at-rules, pseudo classes and keyframes:

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

### Property priorities

Using atomic CSS, longhand properties such as `padding-top` have a _higher_ priority than their shorthand equivalents like `padding`. For example:

```ts
import { css } from '@linaria/atomic';

const noPadding = css`
  padding: 0;
`;

const paddingTop = css`
  padding-top: 5px:
`;

// In react:
<div className={cx(noPadding, paddingTop)}>...</div>;
```

The result will be that the div has `padding-top: 5px;`, as that is higher priority than `padding: 0`.

The way linaria achieves this is through property priorities. See [this blog post](https://weser.io/blog/the-shorthand-longhand-problem-in-atomic-css) for more details on the concept, and the problems it solves. The method used in linaria is to increase the specificity of the rules: see `@linaria/atomic`'s `propertyPriority` function for a list of longhand and shorthand properties supported by this. The basic rules are:

- Longhand properties have higher priority than shorthand properties
- Declarations in @media rules (and any @-rule, such as @supports) have higher priority than those outside of them

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
