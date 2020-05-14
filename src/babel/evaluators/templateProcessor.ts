/**
 * This file handles transforming template literals to class names or styled components and generates CSS content.
 * It uses CSS code from template literals and evaluated values of lazy dependencies stored in ValueCache.
 */

/* eslint-disable no-param-reassign */

import { types } from '@babel/core';
import generator from '@babel/generator';
import { parseSync } from '@babel/core';

import { units } from '../units';
import {
  State,
  StrictOptions,
  TemplateExpression,
  ValueCache,
  Value,
  JSONValue,
} from '../types';
import { DefinitionMeta, StyledMeta, CSSMeta } from '../../types';

import isSerializable from '../utils/isSerializable';
import { debug } from '../utils/logger';
import throwIfInvalid from '../utils/throwIfInvalid';
import stripLines from '../utils/stripLines';
import toCSS from '../utils/toCSS';
import { getLinariaComment } from '../utils/linariaComment';

// Match any valid CSS units followed by a separator such as ;, newline etc.
const unitRegex = new RegExp(`^(${units.join('|')})(;|,|\n| |\\))`);

type Interpolation = {
  id: string;
  node: types.Expression;
  source: string;
  unit: string;
};

export function hasDefinitionMeta(value: Value | undefined | null) {
  return value && typeof value === 'object' && value?.__linaria;
}

function hasCSSMeta(value: Value | undefined | null) {
  return value && typeof value === 'object' && value?.__linaria?.type === 'css';
}

function hasStyledMeta(value: Value | undefined | null) {
  return (
    value && typeof value === 'object' && value?.__linaria?.type === 'styled'
  );
}

const processedPaths = new WeakSet();

export default function getTemplateProcessor(options: StrictOptions) {
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

    const [slug, displayName, className] = getLinariaComment(path);
    let refereedClassName = className;

    if (slug === null) {
      throw new Error('Slug was not generated');
    }

    if (displayName === null) {
      throw new Error('displayName was not generated');
    }

    const parent = path.findParent(
      p =>
        types.isObjectProperty(p) ||
        types.isJSXOpeningElement(p) ||
        types.isVariableDeclarator(p)
    );

    if (parent) {
      const parentNode = parent.node;
      if (
        types.isVariableDeclarator(parentNode) &&
        types.isIdentifier(parentNode.id)
      ) {
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

      if (ex) {
        const { end } = ex.node.loc!;
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

        // Try to preval the value
        if (
          options.evaluate &&
          !(
            types.isFunctionExpression(ex) ||
            types.isArrowFunctionExpression(ex)
          )
        ) {
          let value = valueCache.get(ex.node);
          throwIfInvalid(value, ex);

          // Skip the blank string instead of throwing an error
          if (value === '') {
            return;
          }
          if (value && typeof value !== 'function') {
            // Only insert text for non functions
            // We don't touch functions because they'll be interpolated at runtime

            if (hasDefinitionMeta(value)) {
              value = value as DefinitionMeta;

              // For class composition, resolve composed class name
              if (
                hasCSSMeta(value) &&
                cssText.charAt(cssText.length - 1) !== '.'
              ) {
                value = value as CSSMeta;

                let { styles } = value.__linaria.composes;
                const { replacements } = value.__linaria.composes;
                const placeholders = styles.match(/%%(.)+%%/g);

                placeholders?.forEach((placeholder, placeholderIndex) => {
                  const placeholderKey = placeholder.replace(/%/g, '');
                  const replacement = replacements[placeholderKey];
                  if (typeof replacement === 'function') {
                    const placeholderEndPos =
                      styles.indexOf(placeholder) + placeholder.length;
                    // search for the unit just after placeholder end position
                    // longes unit is 4 characters long, we need also a separator which is max two chars, so 6 chars should be good
                    const unitMatch = styles
                      .substr(placeholderEndPos, 6)
                      .match(unitRegex);
                    const [unitString, unit, separator] =
                      unitMatch !== null ? unitMatch : ['', '', ''];
                    const subId = `${slug}-${i}-${placeholderIndex}`;
                    interpolations.push({
                      id: subId,
                      node: ((parseSync(
                        '(' + replacement.toString() + ')'
                        //@ts-ignore
                      ) as types.File)?.program?.body[0]).expression,
                      source: replacement.toString(),
                      unit: unit,
                    });
                    if (unit !== null) {
                      //remove unit string from styles as it will be added to interpolation
                      styles = styles.replace(
                        placeholder + unitString,
                        placeholder
                      );
                    }
                    styles = styles.replace(
                      placeholder,
                      `var(--${subId})${separator}`
                    );
                  } else {
                    // it is object
                    if (replacement === undefined) {
                      styles = styles.replace(placeholder, '');
                    } else {
                      styles = styles.replace(
                        placeholder,
                        toCSS(replacement as JSONValue)
                      );
                    }
                  }
                });
                cssText += styles;
              } else {
                // if it is not a composition, generate class name of refereed item
                const classNameRef = value.__linaria.className;
                // For styled, prepend it's class name with a dot
                if (hasStyledMeta(value)) {
                  cssText += '.';
                }
                // if user wants to refer a `css` instead of `styles`, he has to add dot by himself
                // regardless it is `styled` or `css`, append the generated class name
                cssText += classNameRef;
              }
            } else if (isSerializable(value)) {
              cssText += stripLines(loc, toCSS(value));
            } else {
              // For anything else, assume it'll be stringified
              cssText += stripLines(loc, value as string | number);
            }

            state.replacements.push({
              original: loc,
              length: cssText.length - beforeLength,
            });
          }
        }

        if (styled) {
          if (
            types.isFunctionExpression(ex) ||
            types.isArrowFunctionExpression(ex)
          ) {
            const id = `${slug}-${i}`;
            interpolations.push({
              id,
              node: ex.node,
              source: ex.getSource() || generator(ex.node).code,
              unit: '',
            });

            cssText += `var(--${id})`;
          }
        } else {
          // would be good to somehow handle situation when interpolation is used in css, but css is not used as a fragment
        }
      }
    });

    let selector = `.${className}`;

    if (styled) {
      // If `styled` wraps another component and not a primitive,
      // get its class name to create a more specific selector
      // it'll ensure that styles are overridden properly
      if (options.evaluate && types.isIdentifier(styled.component.node)) {
        let value: StyledMeta | undefined | null = valueCache.get(
          styled.component.node.name
        ) as StyledMeta | undefined | null;
        while (hasStyledMeta(value)) {
          value = value as StyledMeta;
          selector += `.${value.__linaria.className}`;
          value = value.__linaria.extends;
        }
      }

      const props = [];

      props.push(
        types.objectProperty(
          types.identifier('name'),
          types.stringLiteral(displayName!)
        )
      );

      props.push(
        types.objectProperty(
          types.identifier('class'),
          types.stringLiteral(refereedClassName!)
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
          types.callExpression(
            types.identifier(state.file.metadata.localName || 'styled'),
            [styled.component.node]
          ),
          [types.objectExpression(props)]
        )
      );

      path.addComment('leading', '#__PURE__');
    } else {
      path.replaceWith(types.stringLiteral(refereedClassName!));
    }

    if (!isReferenced && !cssText.includes(':global')) {
      return;
    }

    debug(
      'evaluator:template-processor:extracted-rule',
      `\n${selector} {${cssText}\n}`
    );

    state.rules[selector] = {
      cssText,
      className: className!,
      displayName: displayName!,
      start: path.parent && path.parent.loc ? path.parent.loc.start : null,
    };
  };
}
