/* eslint-disable no-param-reassign */
/* @flow */

const stylis = require('stylis');
const { isValidElementType } = require('react-is');
const Module = require('./module');
const evaluate = require('./evaluate');
const slugify = require('../slugify');
const { units, unitless } = require('./units');

const hyphenate = s =>
  s.replace(/([A-Z])/g, g => `-${g[0].toLowerCase()}`).replace(/^ms-/, '-ms-');

const isPlainObject = o =>
  typeof o === 'object' && o != null && o.constructor.name === 'Object';

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

const unitRegex = new RegExp(`^(${units.join('|')})(;|,|\n| |\\))`);

/* ::
type State = {|
  rules: {
    [className: string]: {
      cssText: string,
      loc: { line: number, column: number },
    },
  },
  index: number,
  dependencies: string[],
  file: {
    opts: {
      filename: string,
    },
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

          // Invalidate cache for module evaluation
          Module.invalidate();
        },
        exit(path /* : any */, state /* : State */) {
          if (Object.keys(state.rules).length) {
            const mappings = [];

            let cssText = '';

            Object.keys(state.rules).forEach((className, index) => {
              mappings.push({
                generated: {
                  line: index + 1,
                  column: 0,
                },
                original: state.rules[className].loc,
                name: className,
              });

              // Run each rule through stylis to support nesting
              cssText += `${stylis(
                `.${className}`,
                state.rules[className].cssText
              )}\n`;
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
          }
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
          styled = { component: tag.arguments[0] };
        } else if (
          t.isMemberExpression(tag) &&
          t.isIdentifier(tag.object) &&
          t.isIdentifier(tag.property) &&
          tag.object.name === 'styled'
        ) {
          styled = { component: t.stringLiteral(tag.property.name) };
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
          let slug = `${displayName.charAt(0).toLowerCase()}${slugify(
            state.file.opts.filename
          )}`;

          let className = `${displayName}_${slug}`;

          while (className in state.rules) {
            // Append 'x' to prevent collision in case of same variable names
            className += 'x';
            slug += 'x';
          }

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
              const result = ex.evaluate();

              if (result.confident) {
                if (isPlainObject(result.value)) {
                  // If it's a plain object, convert it to a CSS string
                  cssText += toCSS(result.value);
                } else if (result.value != null) {
                  // Don't insert anything for null and undefined
                  cssText += result.value;
                }
              } else {
                // Try to preval the value
                if (
                  options.evaluate &&
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
                          cssText += toCSS(value);
                        } else {
                          // For anything else, assume it'll be stringified
                          cssText += value;
                        }
                      }

                      state.dependencies.push(...dependencies);

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
                  const id = `${slug}-${state.index}-${i}`;

                  interpolations.push({
                    id,
                    node: ex.node,
                    source: ex.getSource(),
                    unit: '',
                  });

                  cssText += `var(--${id})`;
                } else {
                  // CSS custom properties can't be used outside components
                  throw ex.buildCodeFrameError(
                    `The CSS cannot contain JavaScript expressions. To evaluate the expressions at build time, pass evaluate: true to the babel plugin.`
                  );
                }
              }
            }
          });

          if (styled) {
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
                t.callExpression(t.identifier('styled'), [styled.component]),
                [t.objectExpression(props)]
              )
            );

            path.addComment('leading', '#__PURE__');
          } else {
            path.replaceWith(t.stringLiteral(className));
          }

          state.rules[className] = { cssText, loc: path.parent.loc.start };
          state.index++;
        }
      },
    },
  };
};
