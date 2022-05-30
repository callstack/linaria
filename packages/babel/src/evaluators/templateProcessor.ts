/**
 * This file handles transforming template literals to class names or styled components and generates CSS content.
 * It uses CSS code from template literals and evaluated values of lazy dependencies stored in ValueCache.
 */

import type { Expression } from '@babel/types';
import generator from '@babel/generator';

import type { StyledMeta } from '@linaria/core';
import { debug } from '@linaria/logger';
import { slugify } from '@linaria/utils';
import { units } from '../units';
import type {
  AtomizeFn,
  Path,
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
import type { Core } from '../babel';
import unwrapSequence from '../utils/unwrapSequence';

// Match any valid CSS units followed by a separator such as ;, newline etc.
const unitRegex = new RegExp(`^(${units.join('|')})(;|,|\n| |\\))`);

type Interpolation = {
  id: string;
  node: Expression;
  source: string;
  unit: string;
};

function hasMeta(value: unknown): value is StyledMeta {
  return typeof value === 'object' && value !== null && '__linaria' in value;
}

const processedPaths = new WeakSet();

function createAtomicString(
  atomize: AtomizeFn | undefined,
  cssText: string,
  displayName: string | null,
  className: string | null,
  state: State,
  path: Path,
  hasPriority: boolean
) {
  if (!atomize) {
    throw new Error(
      'The atomic css API was detected, but an atomize function was not passed in the linaria configuration.'
    );
  }
  const atomicRules = atomize(cssText, hasPriority);
  atomicRules.forEach((rule) => {
    // eslint-disable-next-line no-param-reassign
    state.rules[rule.cssText] = {
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

  return (
    atomicRules
      // Some atomic rules produced (eg. keyframes) don't have class names, and they also don't need to appear in the object
      .filter((rule) => !!rule.className)
      .map((rule) => rule.className!)
      .join(' ')
  );
}

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

    const q = path.get('quasi');
    const expressions = q.get('expressions');

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
            const id =
              // atomize the dynamic interpolation to make it unique
              styled.type === 'atomic-styled'
                ? slugify(ex.getSource() || generator(ex.node).code)
                : // or make the variable unique to this styled component
                  `${slug}-${i}`;

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
              "The CSS cannot contain JavaScript expressions when using the 'css' tag. To evaluate the expressions at build time, pass 'evaluate: true' to the babel plugin."
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

      if (styled.type === 'styled') {
        props.push(
          t.objectProperty(t.identifier('class'), t.stringLiteral(className!))
        );
      }

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

      // replace `styled.div` and `styled(Cmp)` with `styled('div')(props)` and `styled(Cmp)(props)`
      const tagPath = unwrapSequence(path.get('tag'));
      if (tagPath?.isCallExpression() || tagPath?.isSequenceExpression()) {
        // It is styled(Cmp) or (0, react_1.styled)(Cmp)
        // so just add the props to the call
        path.replaceWith(
          t.callExpression(tagPath.node, [t.objectExpression(props)])
        );
      } else if (tagPath?.isMemberExpression()) {
        // It is styled.div
        const obj = tagPath.get('object');
        const prop = tagPath.get('property');

        // It can be only an Identifier… At least I hope.
        if (prop.isIdentifier()) {
          path.replaceWith(
            t.callExpression(
              t.callExpression(obj.node, [t.stringLiteral(prop.node.name)]),
              [t.objectExpression(props)]
            )
          );
        }
      }

      path.addComment('leading', '#__PURE__');

      if (styled.type === 'atomic-styled') {
        const { atomize } = options;
        const isStyledWrapping = t.isIdentifier(styled.component.node);
        const atomicString = createAtomicString(
          atomize,
          cssText,
          displayName,
          className,
          state,
          path,
          // is styled(Component), so we need to increase property priority
          isStyledWrapping
        );

        const classList: string =
          (atomicString ? `${atomicString} ` : '') + className || '';

        props.push(
          t.objectProperty(t.identifier('class'), t.stringLiteral(classList!))
        );

        props.push(
          t.objectProperty(t.identifier('atomic'), t.booleanLiteral(true))
        );

        // atomic-styled doesn't need to generate .className{cssText}
        return;
      }
    } else if (type === 'css') {
      path.replaceWith(t.stringLiteral(className!));
    }

    if (!isReferenced && !cssText.includes(':global')) {
      return;
    }

    if (type === 'atomic-css') {
      const { atomize } = options;
      const atomicString = createAtomicString(
        atomize,
        cssText,
        displayName,
        className,
        state,
        path,
        false
      );
      path.replaceWith(t.stringLiteral(atomicString));
    } else {
      debug(
        'evaluator:template-processor:extracted-rule',
        `\n${selector} {${cssText}\n}`
      );

      // eslint-disable-next-line no-param-reassign
      state.rules[selector] = {
        cssText,
        className: className!,
        displayName: displayName!,
        start: path.parent?.loc?.start ?? null,
      };
    }
  };
}
