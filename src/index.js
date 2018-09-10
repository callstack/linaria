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
          let title;

          const parent = path.findParent(
            p =>
              t.isObjectProperty(p) ||
              t.isJSXOpeningElement(p) ||
              t.isVariableDeclarator(p)
          );

          if (parent) {
            if (t.isObjectProperty(parent)) {
              title = parent.node.key.name || parent.node.key.value;
            } else if (t.isJSXOpeningElement(parent)) {
              title = parent.node.name.name;
            } else if (t.isVariableDeclarator(parent)) {
              title = parent.node.id.name;
            }
          }

          if (!title) {
            throw path.buildCodeFrameError(
              "Couldn't determine the class name for CSS template literal. Ensure that it's either:\n" +
                '- Assigned to a variable\n' +
                '- Is an object property\n' +
                '- Is a prop in a JSX element\n'
            );
          }

          let className = `${title}_${slugify(state.file.opts.filename)}`;

          while (className in state.rules) {
            // Append 'x' to prevent collision in case of same variable names
            className += 'x';
          }

          // Serialize the tagged template literal to a string
          let cssText = '';

          quasi.quasis.forEach((el, i) => {
            cssText += el.value.cooked;

            // Include the intepolations as CSS custom properties
            const ex = quasi.expressions[i];

            if (ex) {
              interpolations[i] = ex;
              cssText += `var(--c-${i})`;
            }
          });

          const args = [tag.arguments[0], t.stringLiteral(className)];

          // If we found any interpolations, also pass them so they can be applied
          if (Object.keys(interpolations).length) {
            args.push(
              t.objectExpression(
                Object.keys(interpolations).map(p =>
                  t.objectProperty(t.stringLiteral(p), interpolations[p])
                )
              )
            );
          }

          path.replaceWith(t.callExpression(t.identifier('component'), args));

          state.rules[className] = cssText;
        }
      },
    },
  };
};
