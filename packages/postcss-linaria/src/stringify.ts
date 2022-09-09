import type {
  Stringifier as StringifierFn,
  Comment,
  Root,
  Document,
  AnyNode,
  Builder,
  AtRule,
  Declaration,
} from 'postcss';
import Stringifier from 'postcss/lib/stringifier';

const placeholderPattern = /^linaria:\d+$/;
/**
 * Stringifies PostCSS nodes while taking interpolated expressions
 * into account.
 */
class LinariaStringifier extends Stringifier {
  /** @inheritdoc */
  public constructor(builder: Builder) {
    const wrappedBuilder: Builder = (
      str: string,
      node?: AnyNode,
      type?: 'start' | 'end'
    ): void => {
      // We purposely ignore the root node since the only thing we should
      // be stringifying here is already JS (before/after raws) so likely
      // already contains backticks on purpose.
      //
      // Similarly, if there is no node, we're probably stringifying
      // pure JS which never contained any CSS. Or something really weird
      // we don't want to touch anyway.
      //
      // For everything else, we want to escape backticks.
      if (!node || node?.type === 'root') {
        builder(str, node, type);
      } else {
        builder(str.replace(/\\/g, '\\\\').replace(/`/g, '\\`'), node, type);
      }
    };
    super(wrappedBuilder);
  }

  public override atrule(node: AtRule, semicolon: boolean): void {
    if (node.name.includes('linaria')) {
      const params = node.params ? this.rawValue(node, 'params') : '';

      const [, expressionIndexString] = node.name.split('linaria');
      const expressionIndex = Number(expressionIndexString);
      const root = node.root();
      const expressionStrings = root.raws.linariaTemplateExpressions;
      if (expressionStrings && !Number.isNaN(expressionIndex)) {
        const expression = expressionStrings[expressionIndex];

        if (expression) {
          if (node.nodes) {
            this.block(node, expression + params);
          } else {
            const end = (node.raws.between || '') + (semicolon ? ';' : '');
            this.builder(expression + params + end, node);
          }
          return;
        }
      }
    }

    super.atrule(node);
  }

  /** @inheritdoc */
  public override comment(node: Comment): void {
    if (placeholderPattern.test(node.text)) {
      const [, expressionIndexString] = node.text.split(':');
      const expressionIndex = Number(expressionIndexString);
      const root = node.root();
      const expressionStrings = root.raws.linariaTemplateExpressions;

      if (expressionStrings && !Number.isNaN(expressionIndex)) {
        const expression = expressionStrings[expressionIndex];

        if (expression) {
          this.builder(expression, node);
          return;
        }
      }
    }

    super.comment(node);
  }

  public override decl(node: Declaration, semicolon: boolean): void {
    const between = this.raw(node, 'between', 'colon');
    let { prop } = node;
    if (prop.includes('linaria')) {
      const [, expressionIndexString] = node.prop.split('linaria');
      const expressionIndex = Number(expressionIndexString);
      const root = node.root();
      const expressionStrings = root.raws.linariaTemplateExpressions;
      if (expressionStrings && !Number.isNaN(expressionIndex)) {
        const expression = expressionStrings[expressionIndex];
        if (expression) prop = expression;
      }
    }

    let value = this.rawValue(node, 'value');
    if (value.includes('linaria')) {
      const values = node.value.split(' ');
      let tempValue = '';
      values.forEach((individualValue, index) => {
        const [, expressionIndexString] = individualValue.split('linaria');
        const expressionIndex = Number(expressionIndexString);
        const root = node.root();
        const expressionStrings = root.raws.linariaTemplateExpressions;
        const expression =
          expressionStrings &&
          !Number.isNaN(expressionIndex) &&
          expressionStrings[expressionIndex];
        if (expression) {
          if (index !== 0) tempValue += ' ';
          tempValue += expression;
        } else {
          if (index !== 0) tempValue += ' ';
          tempValue += individualValue;
        }
      });
      value = tempValue;
    }

    let string = prop + between + value;

    if (node.important) {
      string += node.raws.important || ' !important';
    }

    if (semicolon) string += ';';
    this.builder(string, node);
  }

  /** @inheritdoc */
  public override document(node: Document): void {
    if (node.nodes.length === 0) {
      this.builder(node.source?.input.css ?? '');
    } else {
      super.document(node);
    }
  }

  /** @inheritdoc */
  public override root(node: Root): void {
    this.builder(node.raws.codeBefore ?? '', node, 'start');

    this.body(node);

    // Here we want to recover any previously removed JS indentation
    // if possible. Otherwise, we use the `after` string as-is.
    const after = node.raws.linariaAfter ?? node.raws.after;
    if (after) {
      this.builder(after);
    }

    this.builder(node.raws.codeAfter ?? '', node, 'end');
  }

  /** @inheritdoc */
  public override raw(
    node: AnyNode,
    own: string,
    detect: string | undefined
  ): string {
    if (own === 'before' && node.raws.before && node.raws.linariaBefore) {
      return node.raws.linariaBefore;
    }
    if (own === 'after' && node.raws.after && node.raws.linariaAfter) {
      return node.raws.linariaAfter;
    }
    if (own === 'between' && node.raws.between && node.raws.linariaBetween) {
      return node.raws.linariaBetween;
    }
    return super.raw(node, own, detect);
  }

  /** @inheritdoc */
  public override rawValue(node: AnyNode, prop: string): string {
    const linariaProp = `linaria${prop[0]?.toUpperCase()}${prop.slice(1)}`;
    if (Object.prototype.hasOwnProperty.call(node.raws, linariaProp)) {
      return `${node.raws[linariaProp]}`;
    }

    return super.rawValue(node, prop);
  }
}

export const stringify: StringifierFn = (
  node: AnyNode,
  builder: Builder
): void => {
  const str = new LinariaStringifier(builder);
  str.stringify(node);
};
