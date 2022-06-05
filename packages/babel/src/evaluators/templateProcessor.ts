/**
 * This file handles transforming template literals to class names or styled components and generates CSS content.
 * It uses CSS code from template literals and evaluated values of lazy dependencies stored in ValueCache.
 */

import { NodePath } from '@babel/traverse';
import type { TemplateElement } from '@babel/types';

import type { StyledMeta } from '@linaria/core';
import type { IInterpolation } from '@linaria/core/processors/types';

import type {
  ExpressionValue,
  State,
  StrictOptions,
  TemplateExpression,
  ValueCache,
} from '../types';
import { units } from '../units';
import getTagProcessor from '../utils/getTagProcessor';
import isSerializable from '../utils/isSerializable';
import stripLines from '../utils/stripLines';
import toCSS from '../utils/toCSS';
import unwrapNode from '../utils/unwrapNode';

// Match any valid CSS units followed by a separator such as ;, newline etc.
const unitRegex = new RegExp(`^(${units.join('|')})(;|,|\n| |\\))`);

function hasMeta(value: unknown): value is StyledMeta {
  return typeof value === 'object' && value !== null && '__linaria' in value;
}

const processedPaths = new WeakSet();

/**
 * De-duplicate interpolations based on the source and unit
 * If two interpolations have the same source code and same unit,
 * we don't need to use 2 custom properties for them, we can use a single one
 * @param interpolations
 */
function dedupInterpolations(
  interpolations: IInterpolation[]
): [interpolations: IInterpolation[], replacements: [string, string][]] {
  const interpolationsObj: Record<string, IInterpolation> = {};
  const replacements: [string, string][] = [];

  interpolations.forEach((it) => {
    const key = it.source + it.unit;

    if (key in interpolationsObj) {
      replacements.push([
        `var(--${it.id})`,
        `var(--${interpolationsObj[key].id})`,
      ]);
    } else {
      interpolationsObj[key] = it;
    }
  });

  return [Object.values(interpolationsObj), replacements];
}

export default function getTemplateProcessor(options: StrictOptions) {
  return function process(
    { path, quasis, expressions }: TemplateExpression,
    state: State,
    valueCache: ValueCache
  ) {
    if (processedPaths.has(path)) {
      // Do not process an expression
      // if it is referenced in one template more than once
      return;
    }

    processedPaths.add(path);

    const tagProcessor = getTagProcessor(path, state, options);
    if (!tagProcessor) {
      return;
    }

    // Check if the variable is referenced anywhere for basic DCE
    // Only works when it's assigned to a variable
    let isReferenced = true;

    const parent = path.findParent(
      (p) =>
        p.isObjectProperty() ||
        p.isJSXOpeningElement() ||
        p.isVariableDeclarator()
    );

    if (parent) {
      if (parent.isVariableDeclarator()) {
        const id = parent.get('id');
        if (id.isIdentifier()) {
          const { referencePaths } = path.scope.getBinding(id.node.name) || {
            referencePaths: [],
          };

          isReferenced = referencePaths.length !== 0;
        }
      }
    }

    // Serialize the tagged template literal to a string
    let cssText = '';

    const { length } = quasis;
    const queue: [TemplateElement, ExpressionValue | null][] = [];
    for (let i = 0; i < length; i++) {
      const value = i < length - 1 ? expressions[i] : null;
      queue.push([quasis[i].node, value]);
    }

    queue.forEach(([el, expressionValue], i, self) => {
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
          const last = tagProcessor.lastInterpolation;
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

      if (expressionValue) {
        const ex =
          'originalEx' in expressionValue
            ? expressionValue.originalEx
            : expressionValue.ex;
        const exNode = unwrapNode(ex);

        const { end } = exNode.loc!;
        const beforeLength = cssText.length;

        // The location will be end of the current string to start of next string
        const next = self[i + 1]?.[0];
        const loc = {
          // +1 because the expressions location always shows 1 column before
          start: { line: el.loc!.end.line, column: el.loc!.end.column + 1 },
          end: next
            ? { line: next.loc!.start.line, column: next.loc!.start.column }
            : { line: end.line, column: end.column + 1 },
        };

        const value = valueCache.get(exNode);

        if (value && typeof value !== 'function') {
          // Skip the blank string instead of throw ing an error
          if (value === '') {
            return;
          }

          if (hasMeta(value)) {
            // If it's an React component wrapped in styled, get the class name
            // Useful for interpolating components
            cssText += `.${value.__linaria.className}`;
          } else if (isSerializable(value)) {
            // If it's a plain object or an array, convert it to a CSS string
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

        try {
          const { ex: expression } = expressionValue;
          cssText += tagProcessor.addInterpolation(
            'node' in expression ? expression.node : expression,
            expressionValue.source
          );
        } catch (e) {
          if (e instanceof Error && 'buildCodeFrameError' in ex) {
            throw ex.buildCodeFrameError(e.message);
          }

          throw e;
        }
      }
    });

    const [uniqInterpolations, replacements] = dedupInterpolations(
      tagProcessor.interpolations
    );

    replacements.forEach(([s, r]) => {
      cssText = cssText.replace(s, r);
    });

    const [rules, classes] = tagProcessor.extractRules(
      valueCache,
      cssText,
      path.parent?.loc
    );

    const [replacement, isPure] = tagProcessor.getRuntimeReplacement(
      classes,
      uniqInterpolations
    );

    path.replaceWith(replacement);
    if (isPure) {
      path.addComment('leading', '#__PURE__');
    }

    if (!isReferenced && !cssText.includes(':global')) {
      return;
    }

    // eslint-disable-next-line no-param-reassign
    state.rules = {
      ...state.rules,
      ...rules,
    };
  };
}
