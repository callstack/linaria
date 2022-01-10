"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getLinariaComment;
const pattern = /^linaria (atomic-css|css|styled) (.+)$/;

function getLinariaComment(path, remove = true) {
  const comments = path.node.leadingComments;

  if (!comments) {
    return [null, null, null, null];
  }

  const idx = comments.findIndex(comment => pattern.test(comment.value));

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

  let type = 'styled';

  if (matched[1] === 'css') {
    type = 'css';
  } else if (matched[1] === 'atomic-css') {
    type = 'atomic-css';
  }

  return [type, ...matched[2].split(' ').map(i => i ? i : null)];
}
//# sourceMappingURL=getLinariaComment.js.map