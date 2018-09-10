/* @flow */

const stylis = require('stylis');
const slugify = require('./slugify');

module.exports = function(babel /*: any */) {
  const { types: t } = babel;

  return {
    visitor: {
      Program: {
        enter(path /*: any */, state /*: any */) {
          // Collect all the style rules from the styles we encounter
          state.rules = {};
        },
        exit(path /*: any */, state /*: any */) {
          // Add the collected styles as a comment to the end of file
          path.addComment(
            'trailing',
            'CSS OUTPUT START\n' +
              Object.keys(state.rules)
                .map(
                  className =>
                    // Run each rule through stylis to support nesting
                    `\n${stylis(`.${className}`, state.rules[className])}\n`
                )
                .join('\n') +
              '\nCSS OUTPUT END'
          );
        },
      },
      TaggedTemplateExpression(path /*: any */, state /*: any */) {
        const interpolations = {};
        const { quasi, tag } = path.node;

        if (t.isCallExpression(tag) && tag.callee.name === 'styled') {
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

          let className = `${displayName}_${slugify(state.file.opts.filename)}`;

          while (className in state.rules) {
            // Append 'x' to prevent collision in case of same variable names
            className += 'x';
          }

          // Serialize the tagged template literal to a string
          let cssText = '';

          const expressions = path.get('quasi').get('expressions');

          quasi.quasis.forEach((el, i) => {
            cssText += el.value.cooked;

            const ex = expressions[i];

            if (ex) {
              const result = ex.evaluate();

              if (result.confident) {
                cssText += result.value;
              } else {
                const id = `c-${i}`;

                interpolations[id] = ex.node;
                cssText += `var(--${id})`;
              }
            }
          });

          const options = [];

          options.push(
            t.objectProperty(
              t.stringLiteral('displayName'),
              t.stringLiteral(displayName)
            )
          );

          options.push(
            t.objectProperty(
              t.stringLiteral('className'),
              t.stringLiteral(className)
            )
          );

          // If we found any interpolations, also pass them so they can be applied
          if (Object.keys(interpolations).length) {
            options.push(
              t.objectProperty(
                t.stringLiteral('interpolations'),
                t.objectExpression(
                  Object.keys(interpolations).map(p =>
                    t.objectProperty(t.stringLiteral(p), interpolations[p])
                  )
                )
              )
            );
          }

          path.replaceWith(
            t.callExpression(t.identifier('component'), [
              tag.arguments[0],
              t.objectExpression(options),
            ])
          );

          state.rules[className] = cssText;
        }
      },
    },
  };
};
