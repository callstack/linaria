import type {
  Expression,
  Identifier,
  ObjectExpression,
  ReturnStatement,
  SourceLocation,
  Statement,
  VariableDeclaration,
} from '@babel/types';

import {
  type IInterpolation,
  hasMeta,
  type Params,
  type Rules,
  TaggedTemplateProcessor,
  type TailProcessorParams,
  validateParams,
  type ValueCache,
  type WrappedNode,
} from '@linaria/tags';

export default class StyledProcessor extends TaggedTemplateProcessor {
  public component: WrappedNode;

  #variableIdx = 0;

  #variablesCache = new Map<string, string>();

  constructor(params: Params, ...args: TailProcessorParams) {
    validateParams(
      params,
      ['tag', ['call', 'member'], ['template', 'call']],
      'Invalid usage of `styled` tag'
    );

    const [tag, tagOp, template] = params;

    super([tag, template[0] === 'call' ? ['template', []] : template], ...args);

    let component: WrappedNode | undefined;
    if (tagOp[0] === 'call' && tagOp.length === 2) {
      const value = tagOp[1];
      component = {
        node: value.ex,
        source: value.source,
      };

      this.dependencies.push(value);
    }

    if (tagOp[0] === 'member') {
      [, component] = tagOp;
    }

    if (!component) {
      throw new Error('Invalid usage of `styled` tag');
    }

    this.component = component;
  }

  public override addInterpolation(
    node: Expression,
    source: string,
    unit = ''
  ): string {
    const id = this.getVariableId(source + unit);

    this.interpolations.push({
      id,
      node,
      source,
      unit,
    });

    return id;
  }

  public override doEvaltimeReplacement(): void {
    this.replacer(this.value, false);
  }

  public override doRuntimeReplacement(): void {
    const t = this.astService;

    const statements: Statement[] = [
      this.getClassNameConstantDeclaration(),
      this.getStyleConstantDeclaration(),
    ];
    if (typeof this.component === 'string') {
      // tag
      statements.push(this.getComponentReturnStatement(this.component));
    } else {
      // component or anonymous function
      statements.push(
        this.getComponentConstantDeclaration(this.component.node, 'Component'),
        this.getComponentReturnStatement('Component')
      );
    }
    const body = t.arrowFunctionExpression(
      [t.identifier('props')],
      t.blockStatement(statements)
    );
    this.replacer(body, false);
  }

  public override extractRules(
    valueCache: ValueCache,
    cssText: string,
    loc?: SourceLocation | null
  ): Rules {
    const rules: Rules = {};

    let selector = `.${this.className}`;

    // If `styled` wraps another component and not a primitive,
    // get its class name to create a more specific selector
    // it'll ensure that styles are overridden properly
    let value =
      typeof this.component === 'string'
        ? null
        : valueCache.get(this.component.node.name);
    while (hasMeta(value)) {
      selector += `.${value.__linaria.className}`;
      value = value.__linaria.extends;
    }

    rules[selector] = {
      cssText,
      className: this.className,
      displayName: this.displayName,
      start: loc?.start ?? null,
    };

    return rules;
  }

  public override get asSelector(): string {
    return `.${this.className}`;
  }

  public override get value(): ObjectExpression {
    const t = this.astService;
    const extendsNode =
      typeof this.component === 'string' ? null : this.component.node.name;

    return t.objectExpression([
      t.objectProperty(
        t.stringLiteral('displayName'),
        t.stringLiteral(this.displayName)
      ),
      t.objectProperty(
        t.stringLiteral('__linaria'),
        t.objectExpression([
          t.objectProperty(
            t.stringLiteral('className'),
            t.stringLiteral(this.className)
          ),
          t.objectProperty(
            t.stringLiteral('extends'),
            extendsNode
              ? t.callExpression(t.identifier(extendsNode), [])
              : t.nullLiteral()
          ),
        ])
      ),
    ]);
  }

  public override toString(): string {
    if (typeof this.component === 'string') {
      return `${this.tagSourceCode()}('${this.component}')\`…\``;
    }

    return `${this.tagSourceCode()}('${this.component.source}')\`…\``;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getVariableId(value: string): string {
    if (!this.#variablesCache.has(value)) {
      // make the variable unique to this styled component
      // eslint-disable-next-line no-plusplus
      this.#variablesCache.set(value, `${this.slug}-${this.#variableIdx++}`);
    }

    return this.#variablesCache.get(value)!;
  }

  private getClassNameConstantDeclaration(): VariableDeclaration {
    const t = this.astService;
    return t.variableDeclaration('const', [
      t.variableDeclarator(
        t.identifier('className'),
        t.binaryExpression(
          '+',
          t.stringLiteral(this.className),
          t.conditionalExpression(
            t.memberExpression(t.identifier('props'), t.identifier('class')),
            t.binaryExpression(
              '+',
              t.stringLiteral(' '),
              t.memberExpression(t.identifier('props'), t.identifier('class'))
            ),
            t.stringLiteral('')
          )
        )
      ),
    ]);
  }

  private getComponentConstantDeclaration(
    node: Identifier,
    constantName: string
  ): VariableDeclaration {
    const t = this.astService;

    return t.variableDeclaration('const', [
      t.variableDeclarator(
        t.identifier(constantName),
        t.callExpression(node, [])
      ),
    ]);
  }

  private getComponentReturnStatement(componentName: string): ReturnStatement {
    const t = this.astService;
    return t.returnStatement(
      t.jsxElement(
        t.jsxOpeningElement(
          t.jsxIdentifier(componentName),
          [
            t.jsxSpreadAttribute(t.identifier('props')),
            t.jsxAttribute(
              t.jsxIdentifier('class'),
              t.jsxExpressionContainer(t.identifier('className'))
            ),
            t.jsxAttribute(
              t.jsxIdentifier('style'),
              t.jsxExpressionContainer(t.identifier('style'))
            ),
          ],
          true
        ),
        undefined,
        []
      )
    );
  }

  private getStyleConstantDeclaration(): VariableDeclaration {
    const t = this.astService;

    return t.variableDeclaration('const', [
      t.variableDeclarator(
        t.identifier('style'),
        this.getStyleConstantValueExpression()
      ),
    ]);
  }

  private getStyleConstantValueExpression(): Expression {
    const t = this.astService;

    if (this.interpolations.length === 0) {
      return t.memberExpression(t.identifier('props'), t.identifier('style'));
    }
    const vars: Record<string, Expression> = {};
    this.interpolations.forEach((interpolation) => {
      vars[`--${interpolation.id}`] = this.getVarExpression(interpolation);
    });
    const wrapped = Object.entries(vars).map(([id, expression]) =>
      t.objectProperty(t.stringLiteral(id), expression)
    );
    return t.objectExpression([
      ...wrapped,
      t.spreadElement(
        t.memberExpression(t.identifier('props'), t.identifier('style'))
      ),
    ]);
  }

  private getVarExpression(interpolation: IInterpolation): Expression {
    const t = this.astService;
    const { node, unit } = interpolation;
    const call = t.callExpression(t.callExpression(node, []), [
      t.identifier('props'),
    ]);
    return unit ? t.binaryExpression('+', call, t.stringLiteral(unit)) : call;
  }
}
