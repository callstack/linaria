/* eslint-disable no-param-reassign */

import { types as t } from '@babel/core';
import { relative, dirname, basename } from 'path';
import { isValidElementType } from 'react-is';
import { NodePath } from '@babel/traverse';
import generator from '@babel/generator';
import generateModifierName from '../utils/generateModifierName';
import makeTinyId from './tinyId';

import slugify from '../../slugify';
import { units } from '../units';
import {
  State,
  Styled,
  StrictOptions,
  TemplateExpression,
  ValueCache,
} from '../types';

import throwIfInvalid from '../utils/throwIfInvalid';
import isSerializable from '../utils/isSerializable';
import stripLines from '../utils/stripLines';
import toValidCSSIdentifier from '../utils/toValidCSSIdentifier';
import toCSS from '../utils/toCSS';

// Match any valid CSS units followed by a separator such as ;, newline etc.
const unitRegex = new RegExp(`^(${units.join('|')})(;|,|\n| |\\))`);

type Interpolation = {
  id: string;
  node: t.Expression;
  source: string;
  unit: string;
};

type Modifier = {
  id: string;
  node: t.Expression;
  source: string;
  isFirewalled: boolean;
};

function isStyled(value: any): value is Styled {
  return isValidElementType(value) && (value as any).__linaria;
}

export default function getTemplateProcessor(options: StrictOptions) {
  const tinyId = makeTinyId(options);
  return function process(
    { styled, path }: TemplateExpression,
    state: State,
    valueCache: ValueCache
  ) {
    const { quasi } = path.node;

    // Increment the index of the style we're processing
    // This is used for slug generation to prevent collision
    // Also used for display name if it couldn't be determined
    state.index++;

    const interpolations: Interpolation[] = [];
    const modifiers: Modifier[] = [];

    // Check if the variable is referenced anywhere for basic DCE
    // Only works when it's assigned to a variable
    let isReferenced = true;

    // Try to determine a readable class name
    let displayName;

    const parent = path.findParent(
      p =>
        t.isObjectProperty(p) ||
        t.isJSXOpeningElement(p) ||
        t.isVariableDeclarator(p)
    );

    if (parent) {
      const parentNode = parent.node;
      if (t.isObjectProperty(parentNode)) {
        displayName = parentNode.key.name || parentNode.key.value;
      } else if (
        t.isJSXOpeningElement(parentNode) &&
        t.isJSXIdentifier(parentNode.name)
      ) {
        displayName = parentNode.name.name;
      } else if (
        t.isVariableDeclarator(parentNode) &&
        t.isIdentifier(parentNode.id)
      ) {
        const { referencePaths } = path.scope.getBinding(
          parentNode.id.name
        ) || { referencePaths: [] };

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

    const cls = options.displayName
      ? `${toValidCSSIdentifier(displayName)}_${slug}`
      : slug;

    const className = tinyId(cls);

    // Serialize the tagged template literal to a string
    let cssText = '';

    const expressions = path.get('quasi').get('expressions');

    quasi.quasis.forEach((el, i, self) => {
      let appended = false;

      if (i !== 0) {
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
        const getLoc = () => {
          const { end } = ex.node.loc!;
          // The location will be end of the current string to start of next string
          const next = self[i + 1];
          const loc = {
            // +1 because the expressions location always shows 1 column before
            start: { line: el.loc!.end.line, column: el.loc!.end.column + 1 },
            end: next
              ? { line: next.loc!.start.line, column: next.loc!.start.column }
              : { line: end.line, column: end.column + 1 },
          };
          return loc;
        };
        // Test if ex is inline array expression. This has already been validated.
        // If it is an array expression, evaluate both values seperately.
        if (t.isArrayExpression(ex) && styled) {
          let firewall: boolean;
          // Validate
          // Track if prop should pass through
          let elements = ex.get('elements') as NodePath<any>[];

          if (elements.length === 1) {
            firewall = false;
          } else {
            let fireEl = elements[1];
            const result = fireEl.evaluate();
            if (result.confident) {
              let val = result.value;
              firewall = getFirewall(val, fireEl);
            } else {
              // Try to preval the value
              if (
                options.evaluate &&
                !(
                  t.isFunctionExpression(fireEl) ||
                  t.isArrowFunctionExpression(fireEl)
                )
              ) {
                const value = valueCache.get(fireEl.node);
                firewall = getFirewall(value, fireEl);
              } else {
                throwFirewall(fireEl);
                firewall = false; // Unreachable but will keep TS happy.
              }
            }
          }
          // Generate BEM name from source
          let modEl = elements[0] as NodePath<t.FunctionExpression>;
          let param = modEl.node.params[0];
          let paramText = 'props';
          if ('name' in param) {
            paramText = param.name;
          }
          const body = modEl.get('body');
          let returns: string[] = [];
          const returnVisitor = {
            ReturnStatement(path: NodePath<t.ReturnStatement>) {
              let arg = path.get('argument');
              if (arg) {
                const src =
                  arg.getSource() ||
                  (arg.node && generator(arg.node).code) ||
                  'unknown';
                returns.push(src);
              }
            },
          };
          body.traverse(returnVisitor);
          // If no explicit return statement is found, it is likely an arrow return.
          let bodyText =
            returns[0] === undefined ||
            returns[0] === null ||
            returns[0] === 'unknown'
              ? body.getSource() ||
                (body.node && generator(body.node).code) ||
                'unknown'
              : returns[0];
          const modName = generateModifierName(paramText, bodyText);
          // Push modifier to array
          const id = tinyId(`${slug}--${modName}-${i}`);
          modifiers.push({
            id,
            node: modEl.node,
            source: generator(modEl.node).code,
            isFirewalled: firewall,
          });

          cssText += id;
        } else {
          // Evaluate normal interpolation
          const result = ex.evaluate();
          const beforeLength = cssText.length;
          const loc = getLoc();

          if (result.confident) {
            throwIfInvalid(result.value, ex);

            if (isSerializable(result.value)) {
              // If it's a plain object or an array, convert it to a CSS string
              cssText += stripLines(loc, toCSS(result.value));
            } else {
              cssText += stripLines(loc, result.value);
            }

            state.replacements.push({
              original: loc,
              length: cssText.length - beforeLength,
            });
          } else {
            // Try to preval the value. If preval, return early.
            if (
              options.evaluate &&
              !(t.isFunctionExpression(ex) || t.isArrowFunctionExpression(ex))
            ) {
              const value = valueCache.get(ex.node);
              throwIfInvalid(value, ex);

              if (value && typeof value !== 'function') {
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

                state.replacements.push({
                  original: loc,
                  length: cssText.length - beforeLength,
                });

                return;
              }
            }

            if (styled) {
              const id = tinyId(`${slug}-${i}`);

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
      }
    });

    let selector = `.${className}`;

    if (styled) {
      // If `styled` wraps another component and not a primitive,
      // get its class name to create a more specific selector
      // it'll ensure that styles are overridden properly
      if (options.evaluate && t.isIdentifier(styled.component.node)) {
        let value = valueCache.get(styled.component.node.name);
        while (isValidElementType(value) && value.__linaria) {
          selector += `.${value.__linaria.className}`;
          value = value.__linaria.extends;
        }
      }

      const props = [];

      props.push(
        t.objectProperty(t.identifier('name'), t.stringLiteral(displayName))
      );

      props.push(
        t.objectProperty(t.identifier('class'), t.stringLiteral(className))
      );

      // If any modifiers were found, also pass them so they can be applied.
      if (modifiers.length) {
        // De-duplicate modifiers based on the source
        // If two modifiers have the same source code,
        // we don't need to use 2 classNames for them, we can use a single one.
        const result: { [key: string]: Modifier } = {};
        modifiers.forEach(mod => {
          const key = mod.source;
          if (key in result) {
            cssText = cssText.replace(mod.id, result[key].id);
          } else {
            result[key] = mod;
          }
        });

        props.push(
          t.objectProperty(
            t.identifier('mod'),
            t.objectExpression(
              Object.keys(result).map(key => {
                const { id, node, isFirewalled } = result[key];
                const items = [node];

                if (isFirewalled) {
                  items.push(t.numericLiteral(1));
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
          t.callExpression(t.identifier('styled'), [styled.component.node]),
          [t.objectExpression(props)]
        )
      );

      path.addComment('leading', '#__PURE__');
    } else {
      path.replaceWith(t.stringLiteral(className));
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
  };

  function getFirewall(val: any, path: NodePath<any>) {
    let firewall = false;
    if (val === 1 || val === true) {
      firewall = true;
    } else if (val === 0 || val === false) {
      firewall = false;
    } else {
      throwFirewall(path);
    }
    return firewall;
  }

  function throwFirewall(path: NodePath<any>) {
    throw path.buildCodeFrameError(
      'Firewall passthrough value must statically evaluate to one of:\
            - 1, true, 0, or false. It may also be ommitted in which case passthrough is assumed.\
              Pass a value of 1 or true to block prop passthrough.'
    );
  }
}
