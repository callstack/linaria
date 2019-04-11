/* eslint-disable no-param-reassign */

import { relative, dirname, basename } from 'path';
import { isValidElementType } from 'react-is';
import { types } from '@babel/core';
import generator from '@babel/generator';
import { NodePath } from '@babel/traverse';
import evaluate from '../evaluate';
import slugify from '../../slugify';
import { units } from '../units';
import throwIfInvalid from '../utils/throwIfInvalid';
import isSerializable from '../utils/isSerializable';
import stripLines from '../utils/stripLines';
import toValidCSSIdentifier from '../utils/toValidCSSIdentifier';
import toCSS from '../utils/toCSS';
import hasImport from '../utils/hasImport';
import { State, StrictOptions, Styled } from '../types';

// Match any valid CSS units followed by a separator such as ;, newline etc.
const unitRegex = new RegExp(`^(${units.join('|')})(;|,|\n| |\\))`);

type Interpolation = {
  id: string;
  node: types.Expression;
  source: string;
  unit: string;
};

function isStyled(value: any): value is Styled {
  return isValidElementType(value) && (value as any).__linaria;
}

export default function TaggedTemplateExpression(
  path: NodePath<types.TaggedTemplateExpression>,
  state: State,
  options: StrictOptions
) {
  const { quasi, tag } = path.node;

  let styled: {
    component: any;
  } | null = null;
  let css: boolean = false;

  if (
    types.isCallExpression(tag) &&
    types.isIdentifier(tag.callee) &&
    tag.arguments.length === 1 &&
    tag.callee.name === 'styled' &&
    hasImport(
      types,
      path.scope,
      state.file.opts.filename,
      'styled',
      'linaria/react'
    )
  ) {
    const tagPath = path.get('tag') as NodePath<types.CallExpression>;
    styled = {
      component: tagPath.get('arguments')[0] as NodePath<types.Expression>,
    };
  } else if (
    types.isMemberExpression(tag) &&
    types.isIdentifier(tag.object) &&
    types.isIdentifier(tag.property) &&
    tag.object.name === 'styled' &&
    hasImport(
      types,
      path.scope,
      state.file.opts.filename,
      'styled',
      'linaria/react'
    )
  ) {
    styled = {
      component: { node: types.stringLiteral(tag.property.name) },
    };
  } else if (
    hasImport(types, path.scope, state.file.opts.filename, 'css', 'linaria')
  ) {
    css = types.isIdentifier(tag) && tag.name === 'css';
  }

  if (!styled && !css) {
    return;
  }

  // Increment the index of the style we're processing
  // This is used for slug generation to prevent collision
  // Also used for display name if it couldn't be determined
  state.index++;

  const interpolations: Interpolation[] = [];

  // Check if the variable is referenced anywhere for basic DCE
  // Only works when it's assigned to a variable
  let isReferenced = true;

  // Try to determine a readable class name
  let displayName;

  const parent = path.findParent(
    p =>
      types.isObjectProperty(p) ||
      types.isJSXOpeningElement(p) ||
      types.isVariableDeclarator(p)
  );

  if (parent) {
    const parentNode = parent.node;
    if (types.isObjectProperty(parentNode)) {
      displayName = parentNode.key.name || parentNode.key.value;
    } else if (
      types.isJSXOpeningElement(parentNode) &&
      types.isJSXIdentifier(parentNode.name)
    ) {
      displayName = parentNode.name.name;
    } else if (
      types.isVariableDeclarator(parentNode) &&
      types.isIdentifier(parentNode.id)
    ) {
      const { referencePaths } = path.scope.getBinding(parentNode.id.name) || {
        referencePaths: [],
      };

      isReferenced = referencePaths.length !== 0;
      displayName = parentNode.id.name;
    }
  }

  if (!displayName) {
    // Try to derive the path from the filename
    displayName = basename(state.file.opts.filename);

    if (/^index\.[a-z0-9]+$/.test(displayName)) {
      // If the file name is 'index', better to get name from parent folder
      displayName = basename(dirname(state.file.opts.filename));
    }

    // Remove the file extension
    displayName = displayName.replace(/\.[a-z0-9]+$/, '');

    if (displayName) {
      displayName += state.index;
    } else {
      throw path.buildCodeFrameError(
        "Couldn't determine a name for the component. Ensure that it's either:\n" +
          '- Assigned to a variable\n' +
          '- Is an object property\n' +
          '- Is a prop in a JSX element\n'
      );
    }
  }

  // Custom properties need to start with a letter, so we prefix the slug
  // Also use append the index of the class to the filename for uniqueness in the file
  const slug = toValidCSSIdentifier(
    `${displayName.charAt(0).toLowerCase()}${slugify(
      `${relative(state.file.opts.root, state.file.opts.filename)}:${
        state.index
      }`
    )}`
  );

  let className = options.displayName
    ? `${toValidCSSIdentifier(displayName)}_${slug}`
    : slug;

  // Optionall the className can be defined by the user
  if (typeof options.classNameSlug === 'string') {
    const { classNameSlug } = options;

    // Available variables for the square brackets used in `classNameSlug` options
    const classNameSlugVars = {
      hash: slug,
      title: displayName,
    };

    // Variables that were used in the config for `classNameSlug`
    const optionVariables = classNameSlug.match(/\[.*?\]/g) || [];
    let cnSlug = classNameSlug;

    for (let i = 0, l = optionVariables.length; i < l; i++) {
      const v = optionVariables[i].slice(1, -1); // Remove the brackets around the variable name

      // Replace the var if it key and value exist otherwise place an empty string
      cnSlug = cnSlug.replace(`[${v}]`, classNameSlugVars[v] || '');
    }

    className = toValidCSSIdentifier(cnSlug);
  }

  // Serialize the tagged template literal to a string
  let cssText = '';

  const expressions = path.get('quasi').get('expressions');

  quasi.quasis.forEach((el, i, self) => {
    let appended = false;

    if (i !== 0 && el.value.cooked) {
      // Check if previous expression was a CSS variable that we replaced
      // If it has a unit after it, we need to move the unit into the interpolation
      // e.g. `var(--size)px` should actually be `var(--size)`
      // So we check if the current text starts with a unit, and add the unit to the previous interpolation
      // Another approach would be `calc(var(--size) * 1px), but some browsers don't support all units
      // https://bugzilla.mozilla.org/show_bug.cgi?id=956573
      const matches = el.value.cooked.match(unitRegex);

      if (matches) {
        const last = interpolations[interpolations.length - 1];
        const [, unit] = matches;

        if (last && cssText.endsWith(`var(--${last.id})`)) {
          last.unit = unit;
          cssText += el.value.cooked.replace(unitRegex, '$2');
          appended = true;
        }
      }
    }

    if (!appended) {
      cssText += el.value.cooked;
    }

    const ex = expressions[i];

    if (ex) {
      const { end } = ex.node.loc!;
      const result = ex.evaluate();
      const beforeLength = cssText.length;

      // The location will be end of the current string to start of next string
      const next = self[i + 1];
      const loc = {
        // +1 because the expressions location always shows 1 column before
        start: { line: el.loc!.end.line, column: el.loc!.end.column + 1 },
        end: next
          ? { line: next.loc!.start.line, column: next.loc!.start.column }
          : { line: end.line, column: end.column + 1 },
      };

      if (result.confident) {
        throwIfInvalid(result.value, ex);

        if (isSerializable(result.value)) {
          // If it's a plain object, convert it to a CSS string
          cssText += stripLines(loc, toCSS(result.value));
        } else {
          cssText += stripLines(loc, result.value);
        }

        state.replacements.push({
          original: loc,
          length: cssText.length - beforeLength,
        });
      } else {
        // Try to preval the value
        if (
          options.evaluate &&
          !(
            types.isFunctionExpression(ex) ||
            types.isArrowFunctionExpression(ex)
          )
        ) {
          let evaluation;

          try {
            evaluation = evaluate(
              ex,
              types,
              state.file.opts.filename,
              undefined,
              options
            );
          } catch (e) {
            throw ex.buildCodeFrameError(
              `An error occurred when evaluating the expression: ${
                e.message
              }. Make sure you are not using a browser or Node specific API.`
            );
          }

          const { value, dependencies } = evaluation;

          throwIfInvalid(value, ex);

          if (typeof value !== 'function') {
            // Only insert text for non functions
            // We don't touch functions because they'll be interpolated at runtime

            if (isStyled(value)) {
              // If it's an React component wrapped in styled, get the class name
              // Useful for interpolating components
              cssText += `.${value.__linaria.className}`;
            } else if (isSerializable(value)) {
              cssText += stripLines(loc, toCSS(value));
            } else {
              // For anything else, assume it'll be stringified
              cssText += stripLines(loc, value);
            }

            state.dependencies.push(...dependencies);
            state.replacements.push({
              original: loc,
              length: cssText.length - beforeLength,
            });

            return;
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
    if (options.evaluate && types.isIdentifier(styled.component.node)) {
      let { value } = evaluate(
        styled.component,
        types,
        state.file.opts.filename,
        undefined,
        options
      );

      while (isValidElementType(value) && value.__linaria) {
        selector += `.${value.__linaria.className}`;
        value = value.__linaria.extends;
      }
    }

    const props = [];

    props.push(
      types.objectProperty(
        types.identifier('name'),
        types.stringLiteral(displayName)
      )
    );

    props.push(
      types.objectProperty(
        types.identifier('class'),
        types.stringLiteral(className)
      )
    );

    // If we found any interpolations, also pass them so they can be applied
    if (interpolations.length) {
      // De-duplicate interpolations based on the source and unit
      // If two interpolations have the same source code and same unit,
      // we don't need to use 2 custom properties for them, we can use a single one
      const result: { [key: string]: Interpolation } = {};

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
        types.objectProperty(
          types.identifier('vars'),
          types.objectExpression(
            Object.keys(result).map(key => {
              const { id, node, unit } = result[key];
              const items = [node];

              if (unit) {
                items.push(types.stringLiteral(unit));
              }

              return types.objectProperty(
                types.stringLiteral(id),
                types.arrayExpression(items)
              );
            })
          )
        )
      );
    }

    path.replaceWith(
      types.callExpression(
        types.callExpression(types.identifier('styled'), [
          styled.component.node,
        ]),
        [types.objectExpression(props)]
      )
    );

    path.addComment('leading', '#__PURE__');
  } else {
    path.replaceWith(types.stringLiteral(className));
  }

  if (!isReferenced && !cssText.includes(':global')) {
    return;
  }

  state.rules[selector] = {
    cssText,
    className,
    displayName,
    start: path.parent && path.parent.loc ? path.parent.loc.start : null,
  };
}
