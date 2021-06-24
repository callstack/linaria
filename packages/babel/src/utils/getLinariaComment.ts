import type { Node } from '@babel/types';

const pattern = /^linaria (css|styled) (.+)$/;

export default function getLinariaComment(
  path: { node: Node },
  remove: boolean = true
): ['css' | 'styled' | null, ...(string | null)[]] {
  const comments = path.node.leadingComments;
  if (!comments) {
    return [null, null, null, null];
  }

  const idx = comments.findIndex((comment) => pattern.test(comment.value));
  if (idx === -1) {
    return [null, null, null, null];
  }

  const matched = comments[idx].value.match(pattern);
  if (!matched) {
    return [null, null, null, null];
  }

  if (remove) {
    path.node.leadingComments = comments.filter((_, i) => i !== idx);
  }

  const type = matched[1] === 'css' ? 'css' : 'styled';

  return [type, ...matched[2].split(' ').map((i) => (i ? i : null))];
}
