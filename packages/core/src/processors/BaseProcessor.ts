/* eslint-disable class-methods-use-this */
import type { types as t } from '@babel/core';
import type { SourceLocation, Expression, TemplateElement } from '@babel/types';

import type {
  ExpressionValue,
  IInterpolation,
  IPlaceholder,
  Params,
  Rules,
  Value,
  ValueCache,
  Artifact,
} from './types';
import getClassNameAndSlug from './utils/getClassNameAndSlug';
import hasMeta from './utils/hasMeta';
import templateProcessor from './utils/templateProcessor';
import { isCSSable } from './utils/toCSS';
import type { IFileContext, IOptions } from './utils/types';

export { Expression };

export type ProcessorParams = ConstructorParameters<typeof BaseProcessor>;

export default abstract class BaseProcessor {
  public readonly artifacts: Artifact[] = [];

  public readonly className: string;

  public readonly dependencies: ExpressionValue[] = [];

  public interpolations: IInterpolation[] = [];

  #placeholders: IPlaceholder[] = [];

  public readonly slug: string;

  protected evaluated:
    | Record<'dependencies' | 'expression', Value[]>
    | undefined;

  public constructor(
    protected readonly astService: typeof t,
    protected readonly params: Params,
    protected readonly tagExp: Expression,
    public readonly location: SourceLocation | null,
    protected readonly replacer: (
      replacement: Expression,
      isPure: boolean
    ) => void,
    public readonly template: (TemplateElement | ExpressionValue)[],
    public readonly displayName: string,
    public readonly isReferenced: boolean,
    protected readonly idx: number,
    protected readonly options: IOptions,
    protected readonly context: IFileContext
  ) {
    const { className, slug } = getClassNameAndSlug(
      this.displayName,
      this.idx,
      this.options,
      this.context
    );

    this.className = className;
    this.slug = slug;
  }

  public build(values: ValueCache): Artifact[] {
    if (this.artifacts.length > 0) {
      // FIXME: why it was called twice?
      throw new Error('Tag is already built');
    }

    const artifact = templateProcessor(this, this.template, values);
    if (artifact) {
      this.artifacts.push(['css', artifact]);
    }

    return this.artifacts;
  }

  public isValidValue(value: unknown): value is Value {
    return typeof value === 'function' || isCSSable(value) || hasMeta(value);
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

  /**
   * Perform a replacement for the tag in evaluation time.
   * For example, `css` tag will be replaced with its className,
   * whereas `styled` tag will be replaced with an object with metadata.
   */
  public abstract doEvaltimeReplacement(): void;

  /**
   * Perform a replacement for the tag with its runtime version.
   * For example, `css` tag will be replaced with its className,
   * whereas `styled` tag will be replaced with a component.
   * If some parts require evaluated data for render,
   * they will be replaced with placeholders.
   */
  public abstract doRuntimeReplacement(): void;

  public abstract extractRules(
    valueCache: ValueCache,
    cssText: string,
    loc?: SourceLocation | null
  ): Rules;

  /**
   * A replacement for tag referenced in a template literal.
   */
  public abstract get asSelector(): string;

  protected abstract get tagExpression(): Expression;

  /**
   * A replacement for the tag in evaluation time.
   * For example, `css` tag will be replaced with its className,
   * whereas `styled` tag will be replaced with an object with metadata.
   */
  public abstract get value(): Expression;
}
