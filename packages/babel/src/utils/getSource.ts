import generator from '@babel/generator';
import type { NodePath } from '@babel/traverse';

const getSource = (path: NodePath): string => {
  let source: string | undefined;
  try {
    source = path.getSource();
    // eslint-disable-next-line no-empty
  } catch {}

  source = source || generator(path.node).code;

  return path.node.extra?.parenthesized ? `(${source})` : source;
};

export default getSource;
