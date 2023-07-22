import type { TemplateElement, Expression, SourceLocation } from '@babel/types';

import type { ExpressionValue } from '@linaria/utils';
import { ValueType } from '@linaria/utils';

import type { TailProcessorParams } from './BaseProcessor';
import { BaseProcessor } from './BaseProcessor';
import type { ValueCache, Rules, Params } from './types';
import templateProcessor from './utils/templateProcessor';
import { validateParams } from './utils/validateParams';

export default abstract class TaggedTemplateProcessor extends BaseProcessor {
  #template: (TemplateElement | ExpressionValue)[];

  protected constructor(params: Params, ...args: TailProcessorParams) {
    // Should have at least two params and the first one should be a callee.
    validateParams(
      params,
      ['callee', '*', '...'],
      TaggedTemplateProcessor.SKIP
    );

    validateParams(
      params,
      ['callee', 'template'],
      'Invalid usage of template tag'
    );
    const [tag, [, template]] = params;

    super([tag], ...args);

    template.forEach((element) => {
      if ('kind' in element && element.kind !== ValueType.FUNCTION) {
        this.dependencies.push(element);
      }
    });

    this.#template = template;
  }

  public override build(values: ValueCache) {
    if (this.artifacts.length > 0) {
      // FIXME: why it was called twice?
      throw new Error('Tag is already built');
    }

    const artifact = templateProcessor(
      this,
      this.#template,
      values,
      this.options.variableNameConfig
    );
    if (artifact) {
      this.artifacts.push(['css', artifact]);
    }
  }

  /**
   * It is called for each resolved expression in a template literal.
   * @param node
   * @param precedingCss
   * @param source
   * @param unit
   * @return chunk of CSS that should be added to extracted CSS
   */
  public abstract addInterpolation(
    node: Expression,
    precedingCss: string,
    source: string,
    unit?: string
  ): string;

  public abstract extractRules(
    valueCache: ValueCache,
    cssText: string,
    loc?: SourceLocation | null
  ): Rules;

  public override toString(): string {
    return `${super.toString()}\`…\``;
  }
}
