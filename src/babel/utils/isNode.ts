import { types as t } from '@babel/core';

const isNode = (obj: any): obj is t.Node => obj && obj.type !== undefined;

export default isNode;
