import { types } from '@babel/core';
import { NodePath } from '@babel/traverse';

const pattern = /^linaria (\S+)(?: (\S+))?$/;

export default function getLinariaComment(
  path: NodePath<types.TaggedTemplateExpression>
) {
  const comments = path.node.leadingComments;
  if (!comments) {
    return [null, null];
  }

  const idx = comments.findIndex(comment => pattern.test(comment.value));
  if (idx === -1) {
    return [null, null];
  }

  const matched = comments[idx].value.match(pattern);
  if (!matched) {
    return [null, null];
  }

  path.node.leadingComments = comments.filter((_, i) => i !== idx);

  return [matched[1], matched[2] || null];
}
