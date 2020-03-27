import { types } from '@babel/core';

type Hooks = {
  [key: string]: (node: any) => string | number;
};

const hooks: Hooks = {
  Identifier: (node: types.Identifier) => node.name,
  BinaryExpression: (node: types.BinaryExpression) => node.operator,
  NumericLiteral: (node: types.NumericLiteral) => node.value,
  StringLiteral: (node: types.StringLiteral) => node.value,
};

function isNode(obj: any): obj is types.Node {
  return !!obj;
}

export default function dumpNode<T extends types.Node>(
  node: T,
  alive: Set<types.Node> | null = null,
  level = 0,
  idx: number | null = null
) {
  let result = level === 0 ? '\n' : '';
  const prefix =
    level === 0
      ? ''
      : `${'| '.repeat(level - 1)}${idx === null ? '|' : idx}${
          (idx || 0) < 10 ? '=' : ''
        }`;

  const { type } = node;
  result += `${prefix}${type}${type in hooks ? ` ${hooks[type](node)}` : ''}`;

  if (alive) {
    result += alive.has(node) ? ' ✅' : ' ❌';
  }

  result += '\n';
  const keys = types.VISITOR_KEYS[type] as Array<keyof T>;
  for (const key of keys) {
    const subNode = node[key];

    result += `${'| '.repeat(level)}|-${key}\n`;
    if (Array.isArray(subNode)) {
      for (let i = 0; i < subNode.length; i++) {
        const child = subNode[i];
        if (child) result += dumpNode(child, alive, level + 2, i);
      }
    } else if (isNode(subNode)) {
      result += dumpNode(subNode, alive, level + 2);
    }
  }

  return result;
}
