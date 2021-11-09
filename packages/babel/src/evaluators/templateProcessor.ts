/**
 * This file handles transforming template literals to class names or styled components and generates CSS content.
 * It uses CSS code from template literals and evaluated values of lazy dependencies stored in ValueCache.
 */

import type { Expression } from '@babel/types';
import generator from '@babel/generator';

import type { StyledMeta } from '@linaria/core';
import { debug } from '@linaria/logger';
import { units } from '../units';
import type {
  State,
  StrictOptions,
  TemplateExpression,
  ValueCache,
} from '../types';

import isSerializable from '../utils/isSerializable';
import throwIfInvalid from '../utils/throwIfInvalid';
import stripLines from '../utils/stripLines';
import toCSS from '../utils/toCSS';
import getLinariaComment from '../utils/getLinariaComment';
import { Core } from '../babel';

// Match any valid CSS units followed by a separator such as ;, newline etc.
const unitRegex = new RegExp(`^(${units.join('|')})(;|,|\n| |\\))`);

type Interpolation = {
  id: string;
  node: Expression;
  source: string;
  unit: string;
};

function hasMeta(value: any): value is StyledMeta {
  return value && typeof value === 'object' && (value as any).__linaria;
}

const processedPaths = new WeakSet();

export default function getTemplateProcessor(
  { types: t }: Core,
  options: StrictOptions
) {
  return function process(
    { styled, path }: TemplateExpression,
    state: State,
    valueCache: ValueCache
  ) {
    if (processedPaths.has(path)) {
      // Do not process an expression
      // if it is referenced in one template more than once
      return;
    }

    processedPaths.add(path);

    const { quasi } = path.node;

    const interpolations: Interpolation[] = [];

    // Check if the variable is referenced anywhere for basic DCE
    // Only works when it's assigned to a variable
    let isReferenced = true;

    const [type, slug, displayName, className] = getLinariaComment(path);

    const parent = path.findParent(
      (p) =>
        t.isObjectProperty(p) ||
        t.isJSXOpeningElement(p) ||
        t.isVariableDeclarator(p)
    );

    if (parent) {
      const parentNode = parent.node;
      if (t.isVariableDeclarator(parentNode) && t.isIdentifier(parentNode.id)) {
        const { referencePaths } = path.scope.getBinding(
          parentNode.id.name
        ) || { referencePaths: [] };

        isReferenced = referencePaths.length !== 0;
      }
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

      if (ex && !ex.isExpression()) {
        throw ex.buildCodeFrameError(
          `The expression '${generator(ex.node).code}' is not supported.`
        );
      }

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
          // Try to preval the value
          if (
            options.evaluate &&
            !(t.isFunctionExpression(ex) || t.isArrowFunctionExpression(ex))
          ) {
            const value = valueCache.get(ex.node);
            throwIfInvalid(value, ex);

            // Skip the blank string instead of throw ing an error
            if (value === '') {
              return;
            }

            if (value && typeof value !== 'function') {
              // Only insert text for non functions
              // We don't touch functions because they'll be interpolated at runtime

              if (hasMeta(value)) {
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
      if (options.evaluate && t.isIdentifier(styled.component.node)) {
        let value = valueCache.get(styled.component.node.name);
        while (hasMeta(value)) {
          selector += `.${value.__linaria.className}`;
          value = value.__linaria.extends;
        }
      }

      const props = [];

      props.push(
        t.objectProperty(t.identifier('name'), t.stringLiteral(displayName!))
      );

      props.push(
        t.objectProperty(t.identifier('class'), t.stringLiteral(className!))
      );

      // If we found any interpolations, also pass them so they can be applied
      if (interpolations.length) {
        // De-duplicate interpolations based on the source and unit
        // If two interpolations have the same source code and same unit,
        // we don't need to use 2 custom properties for them, we can use a single one
        const result: { [key: string]: Interpolation } = {};

        interpolations.forEach((it) => {
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
              Object.keys(result).map((key) => {
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
          t.callExpression(
            t.identifier(state.file.metadata.localName || 'styled'),
            [styled.component.node]
          ),
          [t.objectExpression(props)]
        )
      );

      path.addComment('leading', '#__PURE__');
    } else if (type === 'css') {
      path.replaceWith(t.stringLiteral(className!));
    }

    if (!isReferenced && !cssText.includes(':global')) {
      return;
    }

    if (type === 'atomic-css') {
      const { atomize } = options;
      if (!atomize) {
        throw new Error(
          'The atomic css API was detected, but an atomize function was not passed in the linaria configuration.'
        );
      }
      const atomicRules = atomize(cssText);
      atomicRules.forEach((rule) => {
        state.rules[`.${rule.className}`] = {
          cssText: rule.cssText,
          start: path.parent?.loc?.start ?? null,
          className: className!,
          displayName: displayName!,
          atom: true,
        };

        debug(
          'evaluator:template-processor:extracted-atomic-rule',
          `\n${rule.cssText}`
        );
      });

      const atomicClassObject = t.objectExpression(
        atomicRules.map((rule) =>
          t.objectProperty(
            t.stringLiteral(rule.property),
            t.stringLiteral(rule.className)
          )
        )
      );

      path.replaceWith(atomicClassObject);
    } else {
      debug(
        'evaluator:template-processor:extracted-rule',
        `\n${selector} {${cssText}\n}`
      );

      state.rules[selector] = {
        cssText,
        className: className!,
        displayName: displayName!,
        start: path.parent?.loc?.start ?? null,
      };
    }
  };
}
