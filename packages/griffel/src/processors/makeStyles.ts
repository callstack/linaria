/* eslint-disable class-methods-use-this */
import type { Expression } from '@babel/types';
import { resolveStyleRulesForSlots } from '@griffel/core';
import type {
  StylesBySlots,
  CSSClassesMapBySlot,
  CSSRulesByBucket,
} from '@griffel/core/types';

import type { ValueCache, Params, TailProcessorParams } from '@linaria/tags';
import { BaseProcessor, validateParams } from '@linaria/tags';

export default class MakeStylesProcessor extends BaseProcessor {
  #cssClassMap: CSSClassesMapBySlot<string> | undefined;

  #cssRulesByBucket: CSSRulesByBucket | undefined;

  readonly #slotsExpName: string | number | boolean | null;

  public constructor(params: Params, ...args: TailProcessorParams) {
    validateParams(
      params,
      ['callee', 'call'],
      'Invalid usage of `makeStyles` tag'
    );
    const [callee, callParam] = params;

    super([callee], ...args);

    const { ex } = callParam[1];
    if (ex.type === 'Identifier') {
      this.dependencies.push(callParam[1]);
      this.#slotsExpName = ex.name;
    } else if (ex.type === 'NullLiteral') {
      this.#slotsExpName = null;
    } else {
      this.#slotsExpName = ex.value;
    }
  }

  public override get asSelector(): string {
    throw new Error('The result of makeStyles cannot be used as a selector.');
  }

  public override build(valueCache: ValueCache) {
    const slots = valueCache.get(this.#slotsExpName) as StylesBySlots<string>;
    [this.#cssClassMap, this.#cssRulesByBucket] =
      resolveStyleRulesForSlots(slots);
  }

  public override doEvaltimeReplacement(): void {
    this.replacer(this.value, false);
  }

  public override doRuntimeReplacement(): void {
    if (!this.#cssClassMap || !this.#cssRulesByBucket) {
      throw new Error(
        'Styles are not extracted yet. Please call `build` first.'
      );
    }

    const t = this.astService;

    const importedStyles = t.addNamedImport('__styles', '@griffel/react');

    const cssClassMap = t.objectExpression(
      Object.entries(this.#cssClassMap).map(([slot, classesMap]) => {
        return t.objectProperty(
          t.identifier(slot),
          t.objectExpression(
            Object.entries(classesMap).map(([className, classValue]) =>
              t.objectProperty(
                t.identifier(className),
                Array.isArray(classValue)
                  ? t.arrayExpression(classValue.map((i) => t.stringLiteral(i)))
                  : t.stringLiteral(classValue)
              )
            )
          )
        );
      })
    );

    const cssRulesByBucket = t.objectExpression(
      Object.entries(this.#cssRulesByBucket).map(([bucket, rules]) => {
        return t.objectProperty(
          t.identifier(bucket),
          t.arrayExpression(
            // FIXME: rule can be [string, Record<string, unknown>]
            rules.map((rule) => t.stringLiteral(rule as string))
          )
        );
      })
    );

    const stylesCall = t.callExpression(importedStyles, [
      cssClassMap,
      cssRulesByBucket,
    ]);
    this.replacer(stylesCall, true);
  }

  public override get value(): Expression {
    return this.astService.nullLiteral();
  }

  public override toString(): string {
    return `${super.toString()}(…)`;
  }
}
