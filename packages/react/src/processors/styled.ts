import type {
  CallExpression,
  Expression,
  ObjectExpression,
  SourceLocation,
  StringLiteral,
} from '@babel/types';

import type {
  Rules,
  WrappedNode,
  ValueCache,
  Params,
  TailProcessorParams,
} from '@linaria/tags';
import {
  TaggedTemplateProcessor,
  ValueType,
  hasMeta,
  validateParams,
} from '@linaria/tags';

const isNotNull = <T>(x: T | null): x is T => x !== null;

export interface IProps {
  atomic?: boolean;
  class?: string;
  name: string;
  vars?: Record<string, Expression[]>;
}

const singleQuotedStringLiteral = (value: string): StringLiteral => ({
  type: 'StringLiteral',
  value,
  extra: {
    rawValue: value,
    raw: `'${value}'`,
  },
});

export default class StyledProcessor extends TaggedTemplateProcessor {
  public component: WrappedNode;

  #variableIdx = 0;

  #variablesCache = new Map<string, string>();

  constructor(params: Params, ...args: TailProcessorParams) {
    validateParams(
      params,
      ['tag', ['call', 'member'], 'template'],
      'Invalid usage of `styled` tag'
    );

    const [tag, tagOp, template] = params;

    super([tag, template], ...args);

    let component: WrappedNode | undefined;
    if (tagOp[0] === 'call' && tagOp.length === 2) {
      const value = tagOp[1];
      if (value.kind === ValueType.FUNCTION) {
        component = 'FunctionalComponent';
      } else {
        component = {
          node: value.ex,
          source: value.source,
        };

        this.dependencies.push(value);
      }
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

    const props = this.getProps();

    this.replacer(
      t.callExpression(this.tagExpression, [this.getTagComponentProps(props)]),
      true
    );
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

  protected get tagExpressionArgument(): Expression {
    const t = this.astService;
    if (typeof this.component === 'string') {
      if (this.component === 'FunctionalComponent') {
        return t.arrowFunctionExpression([], t.blockStatement([]));
      }

      return singleQuotedStringLiteral(this.component);
    }

    return t.callExpression(t.identifier(this.component.node.name), []);
  }

  protected get tagExpression(): CallExpression {
    const t = this.astService;
    return t.callExpression(this.tag, [this.tagExpressionArgument]);
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
    const res = (arg: string) => `${this.tagSourceCode()}(${arg})\`…\``;

    if (typeof this.component === 'string') {
      if (this.component === 'FunctionalComponent') {
        return res('() => {…}');
      }

      return res(`'${this.component}'`);
    }

    return res(this.component.source);
  }

  protected getProps(): IProps {
    const propsObj: IProps = {
      name: this.displayName,
      class: this.className,
    };

    // If we found any interpolations, also pass them, so they can be applied
    if (this.interpolations.length) {
      propsObj.vars = {};
      this.interpolations.forEach(({ id, unit, node }) => {
        const items: Expression[] = [this.astService.callExpression(node, [])];

        if (unit) {
          items.push(this.astService.stringLiteral(unit));
        }

        propsObj.vars![id] = items;
      });
    }

    return propsObj;
  }

  protected getTagComponentProps(props: IProps): ObjectExpression {
    const t = this.astService;

    const propExpressions = Object.entries(props)
      .map(([key, value]: [key: string, value: IProps[keyof IProps]]) => {
        if (!value) {
          return null;
        }

        const keyNode = t.identifier(key);

        if (typeof value === 'string') {
          return t.objectProperty(keyNode, t.stringLiteral(value));
        }

        if (typeof value === 'boolean') {
          return t.objectProperty(keyNode, t.booleanLiteral(value));
        }

        const vars = Object.entries(value).map(([propName, propValue]) => {
          return t.objectProperty(
            t.stringLiteral(propName),
            t.arrayExpression(propValue)
          );
        });

        return t.objectProperty(keyNode, t.objectExpression(vars));
      })
      .filter(isNotNull);

    return t.objectExpression(propExpressions);
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
}
