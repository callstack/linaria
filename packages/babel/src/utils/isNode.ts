import type { Node } from '@babel/types';

const isNode = (obj: unknown): obj is Node =>
  typeof obj === 'object' &&
  obj !== null &&
  (obj as { type: unknown })?.type !== undefined;

export default isNode;
