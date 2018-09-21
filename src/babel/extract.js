/* eslint-disable no-param-reassign */
/* @flow */

const stylis = require('stylis');
const generator = require('@babel/generator').default;
const { isValidElementType } = require('react-is');
const Module = require('./module');
const evaluate = require('./evaluate');
const slugify = require('../slugify');
const { units, unitless } = require('./units');

const hyphenate = s =>
  // Hyphenate CSS property names from camelCase version from JS string
  // Special case for `-ms` because in JS it starts with `ms` unlike `Webkit`
  s.replace(/([A-Z])/g, g => `-${g[0].toLowerCase()}`).replace(/^ms-/, '-ms-');

const isPlainObject = o =>
  typeof o === 'object' && o != null && o.constructor.name === 'Object';

const toValidCSSIdentifier = s => s.replace(/[^_0-9a-z]/gi, '_');

// Some tools such as polished.js output JS objects
// To support them transparently, we convert JS objects to CSS strings
const toCSS = o =>
  Object.entries(o)
    .filter(
      ([, value]) =>
        // Ignore all falsy values except numbers
        typeof value === 'number' || value
    )
    .map(([key, value]) => {
      if (isPlainObject(value)) {
        return `${hyphenate(key)} { ${toCSS(value)} }`;
      }

      return `${hyphenate(key)}: ${
        /* $FlowFixMe */
        typeof value === 'number' && value !== 0 && !unitless[key]
          ? `${value}px`
          : value
      };`;
    })
    .join(' ');

// Stripping away the new lines ensures that we preserve line numbers
// This is useful in case of tools such as the stylelint pre-processor
// This should be safe because strings cannot contain newline: https://www.w3.org/TR/CSS2/syndata.html#strings
const stripLines = text =>
  String(text)
    .replace(/[\r\n]+/g, ' ')
    .trim();

// Match any valid CSS units followed by a separator such as ;, newline etc.
const unitRegex = new RegExp(`^(${units.join('|')})(;|,|\n| |\\))`);

/* ::
type Location = {
  line: number,
  column: number
}
*/

/* ::
type State = {|
  rules: {
    [className: string]: {
      cssText: string,
      displayName: string,
      start: Location,
    },
  },
  replacements: Array<{
    original: { start: Location, end: Location },
    length: number
  }>,
  index: number,
  dependencies: string[],
  file: {
    opts: {
      filename: string,
    },
    metadata: any,
  },
|};
*/

module.exports = function extract(
  babel /* : any */,
  options /* : { evaluate?: boolean } */ = {}
) {
  const { types: t } = babel;

  return {
    visitor: {
      Program: {
        enter(path /* : any */, state /* : State */) {
          // Collect all the style rules from the styles we encounter
          state.rules = {};
          state.index = 0;
          state.dependencies = [];
          state.replacements = [];

          // Invalidate cache for module evaluation to get fresh modules
          Module.invalidate();
        },
        exit(path /* : any */, state /* : State */) {
          if (Object.keys(state.rules).length) {
            const mappings = [];

            let cssText = '';

            Object.keys(state.rules).forEach((selector, index) => {
              mappings.push({
                generated: {
                  line: index + 1,
                  column: 0,
                },
                original: state.rules[selector].start,
                name: selector,
              });

              // Run each rule through stylis to support nesting
              cssText += `${stylis(selector, state.rules[selector].cssText)}\n`;
            });

            // Add the collected styles as a comment to the end of file
            path.addComment(
              'trailing',
              `\nCSS OUTPUT TEXT START\n${cssText}\nCSS OUTPUT TEXT END\n` +
                `\nCSS OUTPUT MAPPINGS:${JSON.stringify(
                  mappings
                )}\nCSS OUTPUT DEPENDENCIES:${JSON.stringify(
                  // Remove duplicate dependencies
                  state.dependencies.filter(
                    (d, i, self) => self.indexOf(d) === i
                  )
                )}\n`
            );

            // Also return the data as the fle metadata
            // Bundlers or other tools can use this instead of reading the comment
            state.file.metadata = {
              linaria: {
                rules: state.rules,
                replacements: state.replacements,
                dependencies: state.dependencies,
                mappings,
                cssText,
              },
            };
          }

          // Invalidate cache for module evaluation when we're done
          Module.invalidate();
        },
      },
      TaggedTemplateExpression(path /* : any */, state /* : State */) {
        const { quasi, tag } = path.node;

        let styled;

        if (
          t.isCallExpression(tag) &&
          t.isIdentifier(tag.callee) &&
          tag.arguments.length === 1 &&
          tag.callee.name === 'styled'
        ) {
          styled = { component: path.get('tag').get('arguments')[0] };
        } else if (
          t.isMemberExpression(tag) &&
          t.isIdentifier(tag.object) &&
          t.isIdentifier(tag.property) &&
          tag.object.name === 'styled'
        ) {
          styled = { component: { node: t.stringLiteral(tag.property.name) } };
        }

        if (styled || (t.isIdentifier(tag) && tag.name === 'css')) {
          const interpolations = [];

          // Try to determine a readable class name
          let displayName;

          const parent = path.findParent(
            p =>
              t.isObjectProperty(p) ||
              t.isJSXOpeningElement(p) ||
              t.isVariableDeclarator(p)
          );

          if (parent) {
            if (t.isObjectProperty(parent)) {
              displayName = parent.node.key.name || parent.node.key.value;
            } else if (t.isJSXOpeningElement(parent)) {
              displayName = parent.node.name.name;
            } else if (t.isVariableDeclarator(parent)) {
              displayName = parent.node.id.name;
            }
          }

          if (!displayName) {
            throw path.buildCodeFrameError(
              "Couldn't determine a name for the component. Ensure that it's either:\n" +
                '- Assigned to a variable\n' +
                '- Is an object property\n' +
                '- Is a prop in a JSX element\n'
            );
          }

          // Custom properties need to start with a letter, so we prefix the slug
          // Also use append the index of the class to the filename for uniqueness in the file
          const slug = toValidCSSIdentifier(
            `${displayName.charAt(0).toLowerCase()}${slugify(
              `${state.file.opts.filename}:${state.index++}`
            )}`
          );

          const className = toValidCSSIdentifier(`${displayName}_${slug}`);

          // Serialize the tagged template literal to a string
          let cssText = '';

          const expressions = path.get('quasi').get('expressions');

          quasi.quasis.forEach((el, i) => {
            let appended = false;

            if (i !== 0) {
              // Check if previous expression was a CSS variable that we replaced
              // If it has a unit after it, we need to move the unit into the interpolation
              // e.g. `var(--size)px` should actually be `var(--size)`
              // So we check if the current text starts with a unit, and add the unit to the previous interpolation
              const matches = el.value.cooked.match(unitRegex);

              if (matches) {
                const last = interpolations[interpolations.length - 1];
                const [, unit, sep] = matches;

                if (last && cssText.endsWith(`var(--${last.id})`)) {
                  last.unit = unit;
                  cssText += el.value.cooked.replace(unitRegex, sep);
                  appended = true;
                }
              }
            }

            if (!appended) {
              cssText += el.value.cooked;
            }

            const ex = expressions[i];

            if (ex) {
              const { loc } = ex.node;
              const result = ex.evaluate();
              const beforeLength = cssText.length;

              if (result.confident) {
                if (isPlainObject(result.value)) {
                  // If it's a plain object, convert it to a CSS string
                  cssText += stripLines(toCSS(result.value));
                } else if (result.value != null) {
                  // Don't insert anything for null and undefined
                  cssText += stripLines(result.value);
                }

                state.replacements.push({
                  original: loc,
                  length: cssText.length - beforeLength,
                });
              } else {
                // Try to preval the value
                if (
                  options.evaluate !== false &&
                  !(
                    t.isFunctionExpression(ex) ||
                    t.isArrowFunctionExpression(ex)
                  )
                ) {
                  try {
                    const { value, dependencies } = evaluate(
                      ex,
                      t,
                      state.file.opts.filename
                    );

                    if (typeof value !== 'function') {
                      // Only insert text for non functions
                      // We don't touch functions because they'll be interpolated at runtime

                      if (value != null) {
                        if (
                          isValidElementType(value) &&
                          typeof value.className === 'string'
                        ) {
                          // If it's an React component with a classname property, use it
                          // Useful for interpolating components
                          cssText += `.${value.className}`;
                        } else if (isPlainObject(value)) {
                          cssText += stripLines(toCSS(value));
                        } else {
                          // For anything else, assume it'll be stringified
                          cssText += stripLines(value);
                        }
                      }

                      state.dependencies.push(...dependencies);
                      state.replacements.push({
                        original: loc,
                        length: cssText.length - beforeLength,
                      });

                      return;
                    }
                  } catch (e) {
                    throw ex.buildCodeFrameError(
                      `An error occurred when evaluating the expression: ${
                        e.message
                      }. Make sure you are not using a browser or Node specific API.`
                    );
                  }
                }

                if (styled) {
                  const id = `${slug}-${i}`;

                  interpolations.push({
                    id,
                    node: ex.node,
                    source: ex.getSource() || generator(ex.node).code,
                    unit: '',
                  });

                  cssText += `var(--${id})`;
                } else {
                  // CSS custom properties can't be used outside components
                  throw ex.buildCodeFrameError(
                    `The CSS cannot contain JavaScript expressions when using the 'css' tag. To evaluate the expressions at build time, pass 'evaluate: true' to the babel plugin.`
                  );
                }
              }
            }
          });

          let selector = `.${className}`;

          if (styled) {
            // If `styled` wraps another component and not a primitive,
            // get its class name to create a more specific selector
            // it'll ensure that styles are overridden properly
            if (
              options.evaluate !== false &&
              t.isIdentifier(styled.component.node)
            ) {
              let { value } = evaluate(
                styled.component,
                t,
                state.file.opts.filename
              );

              while (isValidElementType(value) && value.className) {
                selector += `.${value.className}`;
                value = value.extends;
              }
            }

            const props = [];

            props.push(
              t.objectProperty(
                t.identifier('name'),
                t.stringLiteral(displayName)
              )
            );

            props.push(
              t.objectProperty(
                t.identifier('class'),
                t.stringLiteral(className)
              )
            );

            // If we found any interpolations, also pass them so they can be applied
            if (interpolations.length) {
              // De-duplicate interpolations based on the source and unit
              // If two interpolations have the same source code and same unit,
              // we don't need to use 2 custom properties for them, we can use a single one
              const result = {};

              interpolations.forEach(it => {
                const key = it.source + it.unit;

                if (key in result) {
                  cssText = cssText.replace(
                    `var(--${it.id})`,
                    `var(--${result[key].id})`
                  );
                } else {
                  result[key] = it;
                }
              });

              props.push(
                t.objectProperty(
                  t.identifier('vars'),
                  t.objectExpression(
                    Object.keys(result).map(key => {
                      const { id, node, unit } = result[key];
                      const items = [node];

                      if (unit) {
                        items.push(t.stringLiteral(unit));
                      }

                      return t.objectProperty(
                        t.stringLiteral(id),
                        t.arrayExpression(items)
                      );
                    })
                  )
                )
              );
            }

            path.replaceWith(
              t.callExpression(
                t.callExpression(t.identifier('styled'), [
                  styled.component.node,
                ]),
                [t.objectExpression(props)]
              )
            );

            path.addComment('leading', '#__PURE__');
          } else {
            path.replaceWith(t.stringLiteral(className));
          }

          state.rules[selector] = {
            cssText,
            className,
            displayName,
            start: path.parent.loc.start,
          };
        }
      },
    },
  };
};
