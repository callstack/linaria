import { types as t } from '@babel/core';
export default function getVisitorKeys(node) {
  return t.VISITOR_KEYS[node.type];
}
//# sourceMappingURL=getVisitorKeys.js.map