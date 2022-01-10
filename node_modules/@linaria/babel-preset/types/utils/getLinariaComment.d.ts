import type { Node } from '@babel/types';
export default function getLinariaComment(path: {
    node: Node;
}, remove?: boolean): ['css' | 'atomic-css' | 'styled' | null, ...(string | null)[]];
