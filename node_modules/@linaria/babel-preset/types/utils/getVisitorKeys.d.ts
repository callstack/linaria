import type { Node } from '@babel/types';
export declare type VisitorKeys<T extends Node> = {
    [K in keyof T]: Exclude<T[K], undefined> extends Node | Node[] | null ? K : never;
}[keyof T] & string;
export default function getVisitorKeys<TNode extends Node>(node: TNode): VisitorKeys<TNode>[];
