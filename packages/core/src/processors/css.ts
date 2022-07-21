import type { Expression, SourceLocation, StringLiteral } from '@babel/types';

import type { ProcessorParams, Rules, ValueCache } from '@linaria/tags';
import { BaseProcessor } from '@linaria/tags';

export default class CssProcessor extends BaseProcessor {
  constructor(...args: ProcessorParams) {
    super(...args);

    if (this.params.length !== 1 || this.params[0][0] !== 'template') {
      throw new Error('Invalid usage of `css` tag');
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public override addInterpolation(node: unknown, source: string): string {
    throw new Error(
      `css tag cannot handle '${source}' as an interpolated value`
    );
  }

  public override doEvaltimeReplacement(): void {
    this.replacer(this.value, false);
  }

  public override doRuntimeReplacement(): void {
    this.replacer(this.astService.stringLiteral(this.className), false);
  }

  public override extractRules(
    valueCache: ValueCache,
    cssText: string,
    loc?: SourceLocation | null
  ): Rules {
    const rules: Rules = {};

    const selector = `.${this.className}`;

    rules[selector] = {
      cssText,
      className: this.className,
      displayName: this.displayName,
      start: loc?.start ?? null,
    };

    return rules;
  }

  public override get asSelector(): string {
    return this.className;
  }

  protected override get tagExpression(): Expression {
    return this.tagExp;
  }

  public override get value(): StringLiteral {
    return this.astService.stringLiteral(this.className);
  }
}
