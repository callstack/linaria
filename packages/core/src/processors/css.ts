import type { SourceLocation, StringLiteral } from '@babel/types';

import type { Rules, ValueCache } from '@linaria/tags';
import { TaggedTemplateProcessor } from '@linaria/tags';

export default class CssProcessor extends TaggedTemplateProcessor {
  // eslint-disable-next-line class-methods-use-this
  public override addInterpolation(
    node: unknown,
    precedingCss: string,
    source: string
  ): string {
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

  public override get value(): StringLiteral {
    return this.astService.stringLiteral(this.className);
  }
}
