// import { nanoid } from 'nanoid';
//
// import type { IBaseEntrypoint } from '../../../types';
// import type { ActionQueueItem, Continuation } from '../types';
//
// const weights: Record<ActionQueueItem['type'], number> = {
//   finalizeEntrypoint: 0,
//   addToCodeCache: 5,
//   transform: 10,
//   explodeReexports: 15,
//   processEntrypoint: 20,
//   processImports: 25,
//   getExports: 30,
//   resolveImports: 35,
//   workflow: 0,
//   collect: -10,
//   evalFile: -5,
//   extract: -15,
// };
//
// const randomIds = new WeakMap<object, string>();
// const randomIdFor = (obj: object) => {
//   if (!randomIds.has(obj)) {
//     randomIds.set(obj, nanoid(10));
//   }
//
//   return randomIds.get(obj);
// };
//
// export const isContinuation = <TAction extends ActionQueueItem>(
//   value: TAction | Continuation<TAction>
// ): value is Continuation<TAction> => {
//   if (!value) {
//     return false;
//   }
//
//   if (typeof value !== 'object') {
//     return false;
//   }
//
//   return 'uid' in value && 'action' in value;
// };
//
// export const getWeight = (action: ActionQueueItem | Continuation): number => {
//   if (isContinuation(action)) {
//     return action.weight;
//   }
//
//   return weights[action.type];
// };
//
// export const keyOf = <T extends ActionQueueItem | Continuation>(
//   node: T
// ): string => {
//   if ('action' in node) {
//     return `${keyOf(node.action)}#${node.uid}`;
//   }
//
//   const name = `${node.type}:${node.entrypoint.name}`;
//   switch (node.type) {
//     case 'addToCodeCache':
//       return `${name}:${randomIdFor(node.data)}`;
//
//     case 'finalizeEntrypoint':
//       return `${name}:${randomIdFor(node.data.finalizer)}`;
//
//     case 'processImports':
//       return `${name}:${randomIdFor(node.data.resolved)}`;
//
//     case 'resolveImports':
//       return node.data.imports
//         ? `${name}:${randomIdFor(node.data.imports)}`
//         : name;
//
//     default:
//       return name;
//   }
// };
//
// const actionsForEntrypoints = new WeakMap<
//   IBaseEntrypoint,
//   Set<ActionQueueItem>
// >();
// export const getRefsCount = (entrypoint: IBaseEntrypoint) =>
//   actionsForEntrypoints.get(entrypoint)?.size ?? 0;
//
// // export const addRef = (
// //   entrypoint: IBaseEntrypoint,
// //   action: ActionQueueItem
// // ) => {
// //   if (!actionsForEntrypoints.has(entrypoint)) {
// //     actionsForEntrypoints.set(entrypoint, new Set());
// //   }
// //
// //   actionsForEntrypoints.get(entrypoint)?.add(action);
// // };
//
// // const actionIdx = 0;
//
// // export function createAction<TType extends ActionQueueItem['type']>(
// //   actionType: TType,
// //   entrypoint: IBaseEntrypoint,
// //   data: TypeOfData<ActionByType<TType>>,
// //   abortSignal: AbortSignal | null = null
// // ): ActionByType<TType> {
// //   actionIdx += 1;
// //   const action = {
// //     ...data,
// //     abortSignal,
// //     entrypoint,
// //     idx: actionIdx.toString(16).padStart(6, '0'),
// //     type: actionType,
// //   } as ActionByType<TType>;
// //   addRef(entrypoint, action);
// //   return action;
// // }
