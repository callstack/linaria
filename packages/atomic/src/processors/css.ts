import type { SourceLocation } from '@babel/types';

import CssProcessor from '@linaria/core/processors/css';
import { debug } from '@linaria/logger';
import type { Rules, ValueCache } from '@linaria/tags';

import atomize from './helpers/atomize';

export default class AtomicCssProcessor extends CssProcessor {
  #classes: string | undefined;

  private get classes(): string {
    if (typeof this.#classes !== 'undefined') {
      return this.#classes;
    }

    throw new Error('Styles are not extracted yet. Please call `build` first.');
  }

  public override doRuntimeReplacement(): void {
    this.replacer(this.astService.stringLiteral(this.classes), false);
  }

  public override extractRules(
    valueCache: ValueCache,
    cssText: string,
    loc?: SourceLocation | null
  ): Rules {
    const rules: Rules = {};

    const atomicRules = atomize(cssText, false);
    atomicRules.forEach((rule) => {
      // eslint-disable-next-line no-param-reassign
      rules[rule.cssText] = {
        cssText: rule.cssText,
        start: loc?.start ?? null,
        className: this.className!,
        displayName: this.displayName!,
        atom: true,
      };

      debug(
        'evaluator:template-processor:extracted-atomic-rule',
        `\n${rule.cssText}`
      );
    });

    this.#classes = atomicRules
      // Some atomic rules produced (eg. keyframes) don't have class names, and they also don't need to appear in the object
      .filter((rule) => !!rule.className)
      .map((rule) => rule.className!)
      .join(' ');

    return rules;
  }
}
