/* eslint-disable class-methods-use-this */
import type { types as t } from '@babel/core';
import type { SourceLocation, Expression } from '@babel/types';

import type {
  IDependency,
  IInterpolation,
  Params,
  Rules,
  ValueCache,
} from './types';
import getClassNameAndSlug from './utils/getClassNameAndSlug';
import type { IFileContext, IOptions } from './utils/types';

export { Expression };

export type ProcessorParams = ConstructorParameters<typeof BaseProcessor>;

export default abstract class BaseProcessor {
  public readonly className: string;

  public readonly dependencies: IDependency[] = [];

  public interpolations: IInterpolation[] = [];

  public readonly slug: string;

  public constructor(
    protected readonly astService: typeof t,
    protected readonly params: Params,
    protected readonly tagExp: Expression,
    public readonly displayName: string,
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

  public get lastInterpolation(): IInterpolation | undefined {
    return this.interpolations[this.interpolations.length - 1];
  }

  /**
   * It is called for each resolved expression in a template literal.
   * @param node
   * @param source
   * @return chunk of CSS that should be added to extracted CSS
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public addInterpolation(node: Expression, source: string): string {
    // CSS custom properties can't be used outside components
    throw new Error(
      "The CSS cannot contain JavaScript expressions when using the 'css' tag. To evaluate the expressions at build time, pass 'evaluate: true' to the babel plugin."
    );
  }

  public abstract extractRules(
    valueCache: ValueCache,
    cssText: string,
    loc?: SourceLocation | null
  ): [rules: Rules, classes: string];

  /**
   * A replacement for the tag in runtime.
   * For example, `css` tag will be replaced with its className,
   * whereas `styled` tag will be replaced with a component.
   * @param classes
   * @param uniqInterpolations
   */
  public abstract getRuntimeReplacement(
    classes: string,
    uniqInterpolations: IInterpolation[]
  ): [Expression, boolean];

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
  public abstract get valueSource(): string;
}
