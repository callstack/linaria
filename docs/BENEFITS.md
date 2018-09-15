# Why use Linaria

## Advantages over regular CSS

### 1. Selectors are scoped

Unlike regular CSS, Linaria will generate scoped class names so that there's no collision between multiple styles in a large application. It's automatic, unlike conventions such as BEM.

### 2. Refactor with confidence

You don't have to worry about breaking an unrelated component when changing and removing styles. Since Linaria's styles are like regular JavaScript variables, it's easy to track their usage and refactor.

### 3. Maximum expressiveness

Linaria supports JavaScript expressions, which enables you to generate style rules inside a declaration programmatically with JavaScript. You can also share constants and helper functions between your CSS and JavaScript, compose styles together and much more.

### 4. Easy to get rid of unused styles

Like other JS variables, linters can warn you about when you have unused styles.

### 5. Automatic vendor prefixing

Linaria will automatically vendor prefix your CSS, so you don't have to worry about supporting older browsers. You write modern CSS, and Linaria takes care of the rest.

### 6. Declarative dynamic styling with React

When using the `styled(..)` helper, Linaria will generate dynamic CSS variables which automatically update when props change. When writing regular CSS, you'll have to manage it manually.

## Advantages over CSS preprocessors

### 1. No new syntax to learn

Linaria's syntax is just like regular CSS, plus ability to nest selectors for convenience. There's no new syntax for variables, mixins or functions. It's just JavaScript.

### 2. All aforementioned advantages

The same advantages over regular CSS apply to preprocessors.

## Advantages over inline styles

### 1. Full power of CSS

Unlike inline styles, you have the full power of CSS with Linaria, such as:

- Media queries
- Animation keyframes
- Hover, focus states etc.
- Pseudo-selectors

### 2. Performance

Class names perform much faster than inline styles.

## Advantages over other CSS-in-JS solutions

### 1. Zero-runtime

Linaria is unique in the sense that it doesn't need a runtime to work. Styles are parsed, evaluated and generated at build time. It can help you improve the load time by loading CSS and JavaScript in parallel, and improve runtime performance because no extra work such as parsing, needs to be done at runtime.

### 2. No framework coupling

Many CSS in JS solutions only work with a single framework such as React. While Linaria provides additional helpers for React components, the core is independent of the framework you use and can be used with any framework that supports class names.

### 3. Familiar CSS syntax

Unlike some CSS in JS solutions, Linaria lets you write normal CSS syntax, which means you can copy paste styles from the browser's dev tools (or StackOverflow), and avoid unnecessary noise in the styles.

### 4. Use without JavaScript

If your website needs to work without JavaScript, or you generate the HTML in advance at build time, Linaria is a great fit for styling such websites.
