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

import { isOriginalField, isOriginalRaw } from './originalState';
import { placeholderText } from './util';

const commentPlaceholderPattern = new RegExp(
  `/\\*\\s*${placeholderText}:(\\d+)\\s*\\*/`,
  'g'
);

// Matches one placeholder occurrence, together with the synthetic marker
// (`.` or `--`) `createPlaceholder` may have prefixed it with to keep it
// parseable in its original context. Global so that adjacent placeholders,
// as in an attribute selector like `[${a}][${b}]`, are all substituted.
const placeholderOccurrencePattern = new RegExp(
  `(?:\\.|--)?${placeholderText}(\\d+)`,
  'g'
);

// The parse phase feeds the template's raw text into PostCSS, so backslashes
// that survive the round trip are already written the way the source writes
// them. A backtick is the only character that still needs attention: an
// unescaped one would end the surrounding template literal. A run of
// backslashes before it is even when the backtick is bare.
const backtickPattern = /(\\*)`/g;

const escapeBacktick = (value: string): string =>
  value.replace(backtickPattern, (_match, backslashes: string) =>
    backslashes.length % 2 === 0 ? `${backslashes}\\\`` : `${backslashes}\``
  );

const escapeChangedField = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/`/g, '\\`');

const rawValueFields = new Set(['params', 'selector', 'value']);

const substitutePlaceholders = (
  stringWithPlaceholders: string,
  expressions: string[]
) => {
  if (!stringWithPlaceholders.includes(placeholderText) || !expressions) {
    return stringWithPlaceholders;
  }

  // A comment placeholder reaches this point when it sits inside a declaration
  // value rather than standing on its own as a comment node. Its `pcss-lin:0`
  // form has a colon where the pattern below expects the index, so it needs
  // its own pass.
  const substituted = stringWithPlaceholders.replace(
    commentPlaceholderPattern,
    (match, index: string) => expressions[Number(index)] ?? match
  );

  // if a match is 'pcss-lin10px', the greedy digit capture leaves the 'px' alone
  return substituted.replace(
    placeholderOccurrencePattern,
    (match, indexString: string) => {
      const expression = expressions[Number(indexString)];
      return expression ?? match;
    }
  );
};

const escapeNodeField = (
  node: AnyNode,
  name: string,
  value: string
): string => {
  const currentValue = (node as unknown as Record<string, unknown>)[name];
  const currentRaw = (node.raws as Record<string, unknown>)[name];
  const isSourceDerived =
    isOriginalField(node, name, currentValue) &&
    (!rawValueFields.has(name) || isOriginalRaw(node, name, currentRaw));
  return isSourceDerived ? escapeBacktick(value) : escapeChangedField(value);
};

const escapeRawField = (node: AnyNode, name: string, value: string): string => {
  const currentValue = (node.raws as Record<string, unknown>)[name];
  return isOriginalRaw(node, name, currentValue)
    ? escapeBacktick(value)
    : escapeChangedField(value);
};

const restoreExpressions = (node: AnyNode, value: string): string =>
  substitutePlaceholders(value, node.root().raws.linariaTemplateExpressions);

/**
 * Stringifies PostCSS nodes while taking interpolated expressions
 * into account.
 */
class LinariaStringifier extends Stringifier {
  public override atrule(node: AtRule, semicolon?: boolean): void {
    let name = `@${escapeNodeField(node, 'name', node.name)}`;
    const params = node.params
      ? escapeNodeField(node, 'params', this.rawValue(node, 'params'))
      : '';

    const afterName = isOriginalRaw(node, 'afterName', node.raws.afterName)
      ? node.raws.linariaAfterName ?? node.raws.afterName
      : node.raws.afterName;
    if (typeof afterName === 'string') {
      name += escapeRawField(node, 'afterName', afterName);
    } else if (params) {
      name += ' ';
    }

    if (node.nodes) {
      this.block(node, name + params);
    } else {
      const between = escapeRawField(node, 'between', node.raws.between || '');
      const end = between + (semicolon ? ';' : '');
      this.builder(restoreExpressions(node, name + params + end), node);
    }
  }

  public override block(node: AtRule | Rule, start: string): void {
    const between = escapeRawField(
      node,
      'between',
      this.raw(node, 'between', 'beforeOpen')
    );
    this.builder(
      restoreExpressions(node, `${start}${between}{`),
      node,
      'start'
    );

    let after: string;
    if (node.nodes?.length) {
      this.body(node);
      after = this.raw(node, 'after', undefined);
    } else {
      after = this.raw(node, 'after', 'emptyBody');
    }

    if (after) this.builder(after);
    this.builder('}', node, 'end');
  }

  /** @inheritdoc */
  public override comment(node: Comment): void {
    const left = escapeRawField(
      node,
      'left',
      this.raw(node, 'left', 'commentLeft')
    );
    const text = escapeNodeField(node, 'text', node.text);
    const right = escapeRawField(
      node,
      'right',
      this.raw(node, 'right', 'commentRight')
    );
    const value = `/*${left}${text}${right}*/`;
    this.builder(restoreExpressions(node, value), node);
  }

  /** @inheritdoc */
  public override decl(node: Declaration, semicolon?: boolean): void {
    const prop = escapeNodeField(node, 'prop', node.prop);
    const between = escapeRawField(
      node,
      'between',
      this.raw(node, 'between', 'colon')
    );
    const value = escapeNodeField(node, 'value', this.rawValue(node, 'value'));
    let string = prop + between + value;

    if (node.important) {
      const important = node.raws.important || ' !important';
      string += escapeRawField(node, 'important', important);
    }

    if (semicolon) string += ';';
    this.builder(restoreExpressions(node, string), node);
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
    if (
      own === 'before' &&
      node.raws.before &&
      node.raws.linariaBefore &&
      isOriginalRaw(node, own, node.raws.before)
    ) {
      return node.raws.linariaBefore;
    }
    if (
      own === 'after' &&
      node.raws.after &&
      node.raws.linariaAfter &&
      isOriginalRaw(node, own, node.raws.after)
    ) {
      return node.raws.linariaAfter;
    }
    if (
      own === 'between' &&
      node.raws.between &&
      node.raws.linariaBetween &&
      isOriginalRaw(node, own, node.raws.between)
    ) {
      return node.raws.linariaBetween;
    }
    return super.raw(node, own, detect);
  }

  /** @inheritdoc */
  public override rawValue(node: AnyNode, prop: string): string {
    const linariaProp = `linaria${prop[0]?.toUpperCase()}${prop.slice(1)}`;
    const currentValue = (node as unknown as Record<string, unknown>)[prop];
    const currentRaw = (node.raws as Record<string, unknown>)[prop];
    if (
      Object.prototype.hasOwnProperty.call(node.raws, linariaProp) &&
      isOriginalField(node, prop, currentValue) &&
      isOriginalRaw(node, prop, currentRaw)
    ) {
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
    const selector = escapeNodeField(
      node,
      'selector',
      this.rawValue(node, 'selector')
    );
    this.block(node, selector);
    if (node.raws.ownSemicolon) {
      const ownSemicolon = escapeRawField(
        node,
        'ownSemicolon',
        node.raws.ownSemicolon
      );
      this.builder(restoreExpressions(node, ownSemicolon), node, 'end');
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
