import { types } from '@babel/core';
import { NodePath } from '@babel/traverse';

const pattern = /^linaria (.+)$/;

export default function getLinariaComment(path: NodePath<types.Node>) {
  const comments = path.node.leadingComments;
  if (!comments) {
    return [null, null, null];
  }

  const idx = comments.findIndex(comment => pattern.test(comment.value));
  if (idx === -1) {
    return [null, null, null];
  }

  const matched = comments[idx].value.match(pattern);
  if (!matched) {
    return [null, null, null];
  }

  path.node.leadingComments = comments.filter((_, i) => i !== idx);

  return matched[1].split(' ').map(i => (i ? i : null));
}
