import { types as t } from '@babel/core';
import { NodePath } from '@babel/traverse';

const pattern = /^linaria (.+)$/;

export function getLinariaComment(
  path: NodePath<t.Node>,
  remove: boolean = true
) {
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

  if (remove) {
    path.node.leadingComments = comments.filter((_, i) => i !== idx);
  }

  return matched[1].split(' ').map(i => (i ? i : null));
}

export function addLinariaComment(
  path: NodePath<t.TaggedTemplateExpression>,
  slug: string,
  displayName: string,
  className: string
) {
  path.addComment('leading', `linaria ${slug} ${displayName} ${className}`);
}
