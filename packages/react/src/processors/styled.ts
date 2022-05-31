import type {
  CallExpression,
  Expression,
  ObjectExpression,
  SourceLocation,
  StringLiteral,
} from '@babel/types';

import type { StyledMeta } from '@linaria/core';
import type { ProcessorParams } from '@linaria/core/processors/BaseProcessor';
import BaseProcessor from '@linaria/core/processors/BaseProcessor';
import type {
  Rules,
  WrappedNode,
  IInterpolation,
  ValueCache,
} from '@linaria/core/processors/types';

export function hasMeta(value: unknown): value is StyledMeta {
  return typeof value === 'object' && value !== null && '__linaria' in value;
}

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

export default class StyledProcessor extends BaseProcessor {
  public component: WrappedNode;

  constructor(...args: ProcessorParams) {
    super(...args);

    let component: WrappedNode | undefined;
    const [type, value, ...rest] = this.params[0] ?? [];
    if (type === 'call' && rest.length === 0) {
      const [source, path] = value;
      if (path.node.type === 'StringLiteral') {
        component = path.node.value;
      } else if (
        path.node.type === 'ArrowFunctionExpression' ||
        path.node.type === 'FunctionExpression'
      ) {
        // Special case when styled wraps a function
        // It's actually the same as wrapping a built-in tag
        component = 'FunctionalComponent';
      } else {
        component = {
          node: path.node,
          source,
        };
        this.dependencies.push({
          ex: path,
          source,
        });
      }
    }

    if (type === 'member') {
      if (value.node.type === 'Identifier') {
        component = value.node.name;
      } else if (value.node.type === 'StringLiteral') {
        component = value.node.value;
      }
    }

    if (!component || this.params.length > 1) {
      throw new Error('Invalid usage of `styled` tag');
    }

    this.component = component;
  }

  public override addInterpolation(node: Expression, source: string) {
    const id = this.getVariableId(source);

    this.interpolations.push({
      id,
      node,
      source,
      unit: '',
    });

    return `var(--${id})`;
  }

  public override extractRules(
    valueCache: ValueCache,
    cssText: string,
    loc?: SourceLocation | null
  ): [Rules, string] {
    const rules: Rules = {};

    let selector = `.${this.className}`;

    // If `styled` wraps another component and not a primitive,
    // get its class name to create a more specific selector
    // it'll ensure that styles are overridden properly
    let value =
      typeof this.component === 'string'
        ? null
        : valueCache.get(this.component.node);
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

    return [rules, this.className];
  }

  public override getRuntimeReplacement(
    classes: string,
    uniqInterpolations: IInterpolation[]
  ): [Expression, boolean] {
    const t = this.astService;

    const props = this.getProps(classes, uniqInterpolations);

    return [
      t.callExpression(this.tagExpression, [this.getTagComponentProps(props)]),
      true,
    ];
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

    return t.identifier(this.component.source);
  }

  protected get tagExpression(): CallExpression {
    const t = this.astService;
    return t.callExpression(this.tagExp, [this.tagExpressionArgument]);
  }

  public override get valueSource(): string {
    const extendsNode =
      typeof this.component === 'string' ? null : this.component.source;
    return `{
    displayName: "${this.displayName}",
    __linaria: {
      className: "${this.className}",
      extends: ${extendsNode}
    }
  }`;
  }

  protected getProps(
    classes: string,
    uniqInterpolations: IInterpolation[]
  ): IProps {
    const propsObj: IProps = {
      name: this.displayName,
      class: this.className,
    };

    // If we found any interpolations, also pass them, so they can be applied
    if (this.interpolations.length) {
      propsObj.vars = {};
      uniqInterpolations.forEach(({ id, unit, node }) => {
        const items: Expression[] = [node];

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
    // make the variable unique to this styled component
    return `${this.slug}-${this.interpolations.length}`;
  }
}
