import type {
  Stringifier as StringifierFn,
  Comment,
  Root,
  Document,
  AnyNode,
  Builder,
  Declaration,
  Rule,
  AtRule,
} from 'postcss';
import Stringifier from 'postcss/lib/stringifier';

import { placeholderText } from './util';

const commentPlaceholderPattern = new RegExp(
  `/\\*\\s*${placeholderText}:(\\d+)\\s*\\*/`,
  'g'
);

const substitutePlaceholders = (
  stringWithPlaceholders: string,
  expressions: string[]
) => {
  if (!stringWithPlaceholders.includes(placeholderText) || !expressions) {
    return stringWithPlaceholders;
  }

  // A comment placeholder reaches this point when it sits inside a declaration
  // value rather than standing on its own as a comment node. The scan below
  // splits on spaces, which cannot see it: the delimiters are separate tokens.
  const substituted = stringWithPlaceholders.replace(
    commentPlaceholderPattern,
    (match, index: string) => expressions[Number(index)] ?? match
  );

  const values = substituted.split(' ');
  const temp: string[] = [];
  values.forEach((val) => {
    let [prefix, expressionIndexString] = val.split(placeholderText);
    prefix = prefix.replace(/(\.|--|\/\*)$/, '');
    // if the val is 'pcss-lin10px', need to remove the px to get the placeholder number
    let suffix = '';
    while (
      Number.isNaN(Number(expressionIndexString)) &&
      expressionIndexString &&
      expressionIndexString.length > 0
    ) {
      suffix = expressionIndexString[expressionIndexString.length - 1] + suffix;
      expressionIndexString = expressionIndexString.slice(
        0,
        expressionIndexString.length - 1
      );
    }
    const expressionIndex = Number(expressionIndexString);
    const expression =
      expressions &&
      !Number.isNaN(expressionIndex) &&
      expressions[expressionIndex];
    if (expression) {
      temp.push(prefix + expression + suffix);
    } else {
      temp.push(val);
    }
  });
  return temp.join(' ');
};

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

  public override atrule(node: AtRule, semicolon?: boolean) {
    // Unlike `decl` and `rule`, this method hands the params back to
    // `super.atrule`, which re-reads them through `rawValue`, and that prefers
    // `raws.linariaParams`. Substituting into `node.params` alone is therefore
    // discarded whenever the params span several lines, so read and write the
    // same place the stringifier will.
    const params = this.rawValue(node, 'params');
    const expressionStrings = node.root().raws.linariaTemplateExpressions;

    if (params.includes(placeholderText)) {
      const substituted = substitutePlaceholders(params, expressionStrings);

      if (node.raws.linariaParams === undefined) {
        // eslint-disable-next-line no-param-reassign
        node.params = substituted;
      } else {
        // eslint-disable-next-line no-param-reassign
        node.raws.linariaParams = substituted;
      }
    }

    // `super.atrule` reads `raws.afterName` straight off the node instead of
    // going through `raw()`, so both the re-indented form and any placeholder
    // substitution have to be written back onto it here. An interpolation on
    // the line after the at-rule name lands in this raw rather than the params.
    const afterName = node.raws.linariaAfterName ?? node.raws.afterName;
    if (typeof afterName === 'string') {
      // eslint-disable-next-line no-param-reassign
      node.raws.afterName = afterName.includes(placeholderText)
        ? substitutePlaceholders(afterName, expressionStrings)
        : afterName;
    }

    super.atrule(node, semicolon);
  }

  /** @inheritdoc */
  public override comment(node: Comment): void {
    const placeholderPattern = new RegExp(`^${placeholderText}:\\d+$`);
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
    const expressionStrings = node.root().raws.linariaTemplateExpressions;
    if (prop.includes(placeholderText)) {
      prop = substitutePlaceholders(prop, expressionStrings);
    }

    let value = this.rawValue(node, 'value');
    if (value.includes(placeholderText)) {
      value = substitutePlaceholders(value, expressionStrings);
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

  public override rule(node: Rule): void {
    let value = this.rawValue(node, 'selector');
    if (value.includes(placeholderText)) {
      const expressionStrings = node.root().raws.linariaTemplateExpressions;
      value = substitutePlaceholders(value, expressionStrings);
    }
    this.block(node, value);
    if (node.raws.ownSemicolon) {
      this.builder(node.raws.ownSemicolon, node, 'end');
    }
  }
}

export const stringify: StringifierFn = (
  node: AnyNode,
  builder: Builder
): void => {
  const str = new LinariaStringifier(builder);
  str.stringify(node);
};
