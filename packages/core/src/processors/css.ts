import type { Expression, SourceLocation } from '@babel/types';

import type { ProcessorParams } from './BaseProcessor';
import BaseProcessor from './BaseProcessor';
import type { Rules, ValueCache } from './types';

export default class CssProcessor extends BaseProcessor {
  constructor(...args: ProcessorParams) {
    super(...args);

    if (this.params.length > 0) {
      throw new Error('Invalid usage of `css` tag');
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public override addInterpolation(): string {
    // CSS custom properties can't be used outside components
    throw new Error(
      "The CSS cannot contain JavaScript expressions when using the 'css' tag. To evaluate the expressions at build time, pass 'evaluate: true' to the babel plugin."
    );
  }

  public override extractRules(
    valueCache: ValueCache,
    cssText: string,
    loc?: SourceLocation | null
  ): [Rules, string] {
    const rules: Rules = {};

    const selector = `.${this.className}`;

    rules[selector] = {
      cssText,
      className: this.className,
      displayName: this.displayName,
      start: loc?.start ?? null,
    };

    return [rules, this.className];
  }

  // eslint-disable-next-line class-methods-use-this
  public override getRuntimeReplacement(
    classes: string
  ): [Expression, boolean] {
    return [this.astService.stringLiteral(classes), false];
  }

  public override get asSelector(): string {
    return this.className;
  }

  protected override get tagExpression(): Expression {
    return this.tagExp;
  }

  public override get valueSource(): string {
    return `"${this.className}"`;
  }
}
