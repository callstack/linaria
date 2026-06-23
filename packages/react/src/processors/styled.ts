import { readFileSync } from 'fs';
import { dirname, join, posix } from 'path';

import {
  buildSlug,
  TaggedTemplateProcessor,
  validateParams,
  toValidCSSIdentifier,
} from '@wyw-in-js/processor-utils';
import type {
  CallExpression,
  Expression,
  Identifier,
  ObjectExpression,
  Params,
  Rules,
  SourceLocation,
  StringLiteral,
  TailProcessorParams,
  ValueCache,
} from '@wyw-in-js/processor-utils';
import type { IVariableContext } from '@wyw-in-js/shared';
import {
  findPackageJSON,
  hasEvalMeta,
  slugify,
  ValueType,
} from '@wyw-in-js/shared';
import { minimatch } from 'minimatch';
import html from 'react-html-attributes';
import { sync as resolveSync } from 'resolve';

const isNotNull = <T>(x: T | null): x is T => x !== null;

const allTagsSet = new Set([...html.elements.html, html.elements.svg]);

export type WrappedNode =
  | string
  | { node: Identifier; nonLinaria?: true; source: string };

export interface IProps {
  atomic?: boolean;
  class?: string;
  name: string;
  propsAsIs: boolean;
  vars?: Record<string, Expression[]>;
}

type StaticSerializableValue = {
  kind: 'serializable';
  value: unknown;
};

type StaticClassNameValue = {
  className: string;
  kind: 'class-name';
  value?: unknown;
};

type StaticSelectorChainValue = {
  className: string;
  kind: 'selector-chain';
  selectors: string[];
  value: StaticStyledValue;
};

type StaticOpaqueComponentValue = {
  className?: string;
  kind: 'opaque-component';
  value?: unknown;
};

type StaticRuntimeCallbackValue = {
  kind: 'runtime-callback';
  value?: unknown;
};

type StaticUnresolvedValue = {
  details?: Readonly<Record<string, unknown>>;
  kind: 'unresolved';
  reason: string;
};

type StaticProcessorValue =
  | StaticClassNameValue
  | StaticOpaqueComponentValue
  | StaticRuntimeCallbackValue
  | StaticSelectorChainValue
  | StaticSerializableValue
  | StaticUnresolvedValue;

type StaticStyledValue = {
  __wyw_meta: {
    className: string;
    extends: StaticStyledValue | null;
  };
  displayName: string;
};

type RawStringLiteral = StringLiteral & {
  extra: {
    raw: string;
    rawValue: string;
  };
};

const staticClassSelector = (className: string): string => `.${className}`;

const isReactLazyValue = (value: unknown): boolean => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    (value as { $$typeof?: unknown }).$$typeof === Symbol.for('react.lazy')
  );
};

const isStaticStyledValue = (value: unknown): value is StaticStyledValue => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const meta = (value as { __wyw_meta?: unknown }).__wyw_meta;
  return (
    typeof meta === 'object' &&
    meta !== null &&
    typeof (meta as { className?: unknown }).className === 'string' &&
    ('extends' in meta
      ? (meta as { extends?: unknown }).extends === null ||
        isStaticStyledValue((meta as { extends?: unknown }).extends)
      : false)
  );
};

const staticStyledValueFromProcessorValue = (
  value: StaticProcessorValue
): StaticStyledValue | null =>
  value.kind === 'selector-chain' && isStaticStyledValue(value.value)
    ? value.value
    : null;

const staticSelectorsFromProcessorValue = (
  value: StaticProcessorValue
): string[] => {
  if (value.kind === 'selector-chain') {
    return value.selectors;
  }

  if (value.kind === 'class-name') {
    return [staticClassSelector(value.className)];
  }

  return [];
};

const singleQuotedStringLiteral = (value: string): RawStringLiteral => ({
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
    // Should have at least two params and the first one should be a callee.
    validateParams(
      params,
      ['callee', '*', '...'],
      TaggedTemplateProcessor.SKIP
    );

    validateParams(
      params,
      ['callee', ['call', 'member'], ['template', 'call']],
      'Invalid usage of `styled` tag'
    );

    const [tag, tagOp, template] = params;

    if (template[0] === 'call') {
      // It is already transformed styled-literal. Skip it.
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw TaggedTemplateProcessor.SKIP;
    }

    super([tag, template], ...args);

    let component: WrappedNode | undefined;
    if (tagOp[0] === 'call' && tagOp.length === 2) {
      const value = tagOp[1];
      if (value.kind === ValueType.FUNCTION) {
        component = 'FunctionalComponent';
      } else if (value.kind === ValueType.CONST) {
        component = typeof value.value === 'string' ? value.value : undefined;
      } else {
        if (value.importedFrom?.length) {
          const selfPkg = findPackageJSON('.', this.context.filename);

          // Check if at least one used identifier is a Linaria component.
          const isSomeMatched = value.importedFrom.some((importedFrom) => {
            const importedPkg =
              // If package.json is not found, assume it's a local package
              findPackageJSON(importedFrom, this.context.filename) ?? selfPkg;

            if (importedPkg) {
              const packageJSON = JSON.parse(readFileSync(importedPkg, 'utf8'));
              const mask: string | undefined = packageJSON?.linaria?.components;
              if (importedPkg === selfPkg && mask === undefined) {
                // If mask is not specified for the local package, all components are treated as styled.
                return true;
              }

              if (mask) {
                const packageDir = dirname(importedPkg);
                // Masks for minimatch should always use POSIX slashes
                const fullMask = join(packageDir, mask).replace(
                  /\\/g,
                  posix.sep
                );

                try {
                  const fileWithComponent = resolveSync(importedFrom, {
                    basedir: dirname(this.context.filename!),
                    extensions: this.options.extensions,
                  });

                  return minimatch(fileWithComponent, fullMask);
                } catch (e) {
                  // It means that resolver can't find the file.
                  // eslint-disable-next-line no-console
                  console.warn(
                    `Can't resolve ${importedFrom} from ${this.context.filename}. If ${value.source} is another styled component, it should be resolvable with default Node.js resolver. If it's not, please exclude it from the linaria.components mask in package.json.`
                  );

                  return false;
                }
              }
            }

            return false;
          });

          if (!isSomeMatched) {
            component = {
              node: value.ex,
              nonLinaria: true,
              source: value.source,
            };
          }
        }

        if (component === undefined) {
          component = {
            node: value.ex,
            source: value.source,
          };

          this.dependencies.push(value);
        }
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

  public override get asSelector(): string {
    return `.${this.className}`;
  }

  public override get value(): ObjectExpression {
    const t = this.astService;
    const extendsNode =
      typeof this.component === 'string' || this.component.nonLinaria
        ? null
        : this.component.node.name;

    return t.objectExpression([
      t.objectProperty(
        t.stringLiteral('displayName'),
        t.stringLiteral(this.displayName)
      ),
      t.objectProperty(
        t.stringLiteral('__wyw_meta'),
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

  protected get tagExpression(): CallExpression {
    const t = this.astService;
    return t.callExpression(this.callee, [this.tagExpressionArgument]);
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

  public override addInterpolation(
    node: Expression,
    precedingCss: string,
    source: string,
    unit = ''
  ): string {
    const id = this.getVariableId(source, unit, precedingCss);

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
      typeof this.component === 'string' || this.component.nonLinaria
        ? null
        : valueCache.get(this.component.node.name);
    while (hasEvalMeta(value)) {
      selector += `.${value.__wyw_meta.className}`;
      value = value.__wyw_meta.extends;
    }

    if (isReactLazyValue(value)) {
      selector += `.${this.className}`;
    }

    rules[selector] = {
      cssText,
      className: this.className,
      displayName: this.displayName,
      start: loc?.start ?? null,
    };

    return rules;
  }

  public getStaticValue(): StaticProcessorValue {
    if (typeof this.component !== 'string' && !this.component.nonLinaria) {
      return {
        details: {
          component: this.component.source,
        },
        kind: 'unresolved',
        reason: 'styled-target-static-value-required',
      };
    }

    return this.createStaticSelectorValue(null);
  }

  // eslint-disable-next-line class-methods-use-this
  public resolveStaticInterpolation(
    _interpolation: unknown,
    value: StaticProcessorValue
  ): StaticProcessorValue | null {
    const selectors = staticSelectorsFromProcessorValue(value);
    if (selectors.length === 0) {
      return null;
    }

    return {
      kind: 'serializable',
      value: selectors.join(''),
    };
  }

  public resolveStaticTagTarget(
    target: StaticProcessorValue
  ): StaticProcessorValue | null {
    if (
      target.kind === 'opaque-component' ||
      target.kind === 'runtime-callback'
    ) {
      return this.createStaticSelectorValue(null);
    }

    const extendsValue = staticStyledValueFromProcessorValue(target);
    if (!extendsValue && target.kind !== 'class-name') {
      return null;
    }

    return this.createStaticSelectorValue(extendsValue);
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

  protected createStaticSelectorValue(
    extendsValue: StaticStyledValue | null
  ): StaticSelectorChainValue {
    const ownSelector = staticClassSelector(this.className);
    const selectors = [ownSelector];
    let current = extendsValue;

    while (current) {
      selectors.push(staticClassSelector(current.__wyw_meta.className));
      current = current.__wyw_meta.extends;
    }

    return {
      className: this.className,
      kind: 'selector-chain',
      selectors,
      value: {
        displayName: this.displayName,
        __wyw_meta: {
          className: this.className,
          extends: extendsValue,
        },
      },
    };
  }

  protected getCustomVariableId(
    source: string,
    unit: string,
    precedingCss: string
  ) {
    const context = this.getVariableContext(source, unit, precedingCss);
    const customSlugFn = this.options.variableNameSlug;
    if (!customSlugFn) {
      return undefined;
    }

    return typeof customSlugFn === 'function'
      ? customSlugFn(context)
      : buildSlug(customSlugFn, { ...context });
  }

  protected getProps(): IProps {
    const propsObj: IProps = {
      name: this.displayName,
      class: this.className,
      propsAsIs:
        typeof this.component !== 'string' || !allTagsSet.has(this.component),
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
        if (value === undefined) {
          return null;
        }

        const keyNode = t.identifier(key);

        if (value === null) {
          return t.objectProperty(keyNode, t.nullLiteral());
        }

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

  protected getVariableContext(
    source: string,
    unit: string,
    precedingCss: string
  ): IVariableContext {
    const getIndex = () => {
      // eslint-disable-next-line no-plusplus
      return this.#variableIdx++;
    };

    return {
      componentName: this.displayName,
      componentSlug: this.slug,
      get index() {
        return getIndex();
      },
      precedingCss,
      processor: this.constructor.name,
      source,
      unit,
      valueSlug: slugify(source + unit),
    };
  }

  protected getVariableId(
    source: string,
    unit: string,
    precedingCss: string
  ): string {
    const value = source + unit;
    if (!this.#variablesCache.has(value)) {
      const id = this.getCustomVariableId(source, unit, precedingCss);
      if (id) {
        return toValidCSSIdentifier(id);
      }

      const context = this.getVariableContext(source, unit, precedingCss);

      // make the variable unique to this styled component
      this.#variablesCache.set(value, `${this.slug}-${context.index}`);
    }

    return this.#variablesCache.get(value)!;
  }
}
