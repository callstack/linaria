import type { TemplateElement, Expression, SourceLocation } from '@babel/types';

import type { TailProcessorParams } from './BaseProcessor';
import BaseProcessor from './BaseProcessor';
import type { ExpressionValue, ValueCache, Rules, Params } from './types';
import templateProcessor from './utils/templateProcessor';
import { validateParams } from './utils/validateParams';

export default abstract class TaggedTemplateProcessor extends BaseProcessor {
  #template: (TemplateElement | ExpressionValue)[];

  public constructor(params: Params, ...args: TailProcessorParams) {
    validateParams(
      params,
      ['tag', 'template'],
      'Invalid usage of template tag'
    );
    const [tag, [, template]] = params;

    super([tag], ...args);

    template.forEach((element) => {
      if ('kind' in element) {
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

    const artifact = templateProcessor(this, this.#template, values);
    if (artifact) {
      this.artifacts.push(['css', artifact]);
    }
  }

  /**
   * It is called for each resolved expression in a template literal.
   * @param node
   * @param source
   * @param unit
   * @return chunk of CSS that should be added to extracted CSS
   */
  public abstract addInterpolation(
    node: Expression,
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
