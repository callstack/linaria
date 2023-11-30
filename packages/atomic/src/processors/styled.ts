import type { SourceLocation } from '@babel/types';
import type { Rules, ValueCache } from '@wyw-in-js/processor-utils';
import { logger, hasEvalMeta } from '@wyw-in-js/shared';

import type { IProps } from '@linaria/react/processors/styled';
import StyledProcessor from '@linaria/react/processors/styled';

import atomize from './helpers/atomize';

const debug = logger.extend('AtomicStyledProcessor');

export default class AtomicStyledProcessor extends StyledProcessor {
  #classes: string | undefined;

  private get classes(): string {
    if (this.#classes) {
      return this.#classes;
    }

    throw new Error(
      'Styles are not extracted yet. Please call `extractRules` first.'
    );
  }

  public override extractRules(
    valueCache: ValueCache,
    cssText: string,
    loc?: SourceLocation | null
  ): Rules {
    const rules: Rules = {};

    const wrappedValue =
      typeof this.component === 'string'
        ? null
        : valueCache.get(this.component.node.name);

    const atomicRules = atomize(cssText, hasEvalMeta(wrappedValue));
    atomicRules.forEach((rule) => {
      // eslint-disable-next-line no-param-reassign
      rules[rule.cssText] = {
        cssText: rule.cssText,
        start: loc?.start ?? null,
        className: this.className,
        displayName: this.displayName,
        atom: true,
      };

      debug('extracted-atomic-rule:\n%s', rule.cssText);
    });

    this.#classes = atomicRules
      // Some atomic rules produced (eg. keyframes) don't have class names, and they also don't need to appear in the object
      .filter((rule) => !!rule.className)
      .map((rule) => rule.className!)
      .join(' ');

    return rules;
  }

  protected override getProps(): IProps {
    const props = super.getProps();
    props.class = [this.classes, this.className].filter(Boolean).join(' ');
    props.atomic = true;
    return props;
  }

  protected override getVariableId(
    source: string,
    unit: string,
    precedingCss: string
  ): string {
    const id = this.getCustomVariableId(source, unit, precedingCss);
    if (id) {
      return id;
    }

    const context = this.getVariableContext(source, unit, precedingCss);
    // id is based on the slugified value
    return context.valueSlug;
  }
}
