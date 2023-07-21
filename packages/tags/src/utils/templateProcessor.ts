/* eslint-disable no-continue */
/**
 * This file handles transforming template literals to class names or styled components and generates CSS content.
 * It uses CSS code from template literals and evaluated values of lazy dependencies stored in ValueCache.
 */

import type { TemplateElement, SourceLocation } from '@babel/types';

import type { ExpressionValue, Replacements } from '@linaria/utils';
import { hasMeta, ValueType } from '@linaria/utils';

import type TaggedTemplateProcessor from '../TaggedTemplateProcessor';
import type { ValueCache, Rules } from '../types';

import { getVariableName } from './getVariableName';
import stripLines from './stripLines';
import throwIfInvalid from './throwIfInvalid';
import toCSS, { isCSSable } from './toCSS';
import type { IOptions } from './types';
import { units } from './units';

// Match any valid CSS units followed by a separator such as ;, newline etc.
const unitRegex = new RegExp(`^(?:${units.join('|')})\\b`);

export default function templateProcessor(
  tagProcessor: TaggedTemplateProcessor,
  [...template]: (TemplateElement | ExpressionValue)[],
  valueCache: ValueCache,
  variableNameConfig: IOptions['variableNameConfig'] | undefined
): [rules: Rules, sourceMapReplacements: Replacements] | null {
  const sourceMapReplacements: Replacements = [];
  // Check if the variable is referenced anywhere for basic DCE
  // Only works when it's assigned to a variable
  const { isReferenced } = tagProcessor;

  // Serialize the tagged template literal to a string
  let cssText = '';

  let item: TemplateElement | ExpressionValue | undefined;
  let lastTemplateElementLocation: SourceLocation | null | undefined;
  // eslint-disable-next-line no-cond-assign
  while ((item = template.shift())) {
    if ('type' in item) {
      // It's a template element
      cssText += item.value.cooked;
      lastTemplateElementLocation = item.loc;
      continue;
    }

    // It's an expression
    const { ex } = item;

    const { end } = ex.loc!;
    const beforeLength = cssText.length;

    // The location will be end of the current string to start of next string
    const next = template[0] as TemplateElement; // template[0] is the next template element
    const loc = {
      // +1 because an expression location always shows 1 column before
      start: {
        line: lastTemplateElementLocation!.end.line,
        column: lastTemplateElementLocation!.end.column + 1,
      },
      end: next
        ? { line: next.loc!.start.line, column: next.loc!.start.column }
        : { line: end.line, column: end.column + 1 },
    };

    const value = 'value' in item ? item.value : valueCache.get(item.ex.name);

    // Is it props based interpolation?
    if (item.kind === ValueType.FUNCTION || typeof value === 'function') {
      // Check if previous expression was a CSS variable that we replaced
      // If it has a unit after it, we need to move the unit into the interpolation
      // e.g. `var(--size)px` should actually be `var(--size)`
      // So we check if the current text starts with a unit, and add the unit to the previous interpolation
      // Another approach would be `calc(var(--size) * 1px), but some browsers don't support all units
      // https://bugzilla.mozilla.org/show_bug.cgi?id=956573
      const matches = next.value.cooked?.match(unitRegex);

      try {
        if (matches) {
          template.shift();
          const [unit] = matches;

          const varId = tagProcessor.addInterpolation(
            item.ex,
            cssText,
            item.source,
            unit
          );
          cssText += getVariableName(varId, variableNameConfig);

          cssText += next.value.cooked?.substring(unit?.length ?? 0) ?? '';
        } else {
          const varId = tagProcessor.addInterpolation(
            item.ex,
            cssText,
            item.source
          );
          cssText += getVariableName(varId, variableNameConfig);
        }
      } catch (e) {
        if (e instanceof Error) {
          throw item.buildCodeFrameError(e.message);
        }

        throw e;
      }
    } else {
      throwIfInvalid(
        tagProcessor.isValidValue.bind(tagProcessor),
        value,
        item,
        item.source
      );

      if (value !== undefined && typeof value !== 'function') {
        // Skip the blank string instead of throw ing an error
        if (value === '') {
          continue;
        }

        if (hasMeta(value)) {
          // If it's a React component wrapped in styled, get the class name
          // Useful for interpolating components
          cssText += `.${value.__linaria.className}`;
        } else if (isCSSable(value)) {
          // If it's a plain object or an array, convert it to a CSS string
          cssText += stripLines(loc, toCSS(value));
        } else {
          // For anything else, assume it'll be stringified
          cssText += stripLines(loc, value);
        }

        sourceMapReplacements.push({
          original: loc,
          length: cssText.length - beforeLength,
        });
      }
    }
  }

  const rules = tagProcessor.extractRules(
    valueCache,
    cssText,
    tagProcessor.location
  );

  // tagProcessor.doRuntimeReplacement(classes);
  if (!isReferenced && !cssText.includes(':global')) {
    return null;
  }

  // eslint-disable-next-line no-param-reassign
  return [rules, sourceMapReplacements];
}
