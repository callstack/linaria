import type { Node } from '@babel/types';

const isNode = (obj: any): obj is Node => obj?.type !== undefined;

export default isNode;
