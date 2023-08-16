import { nanoid } from 'nanoid';

import type { IBaseEntrypoint } from '../../../types';
import type {
  ActionQueueItem,
  IBaseAction,
  DataOf,
  EventsHandlers,
  ActionByType,
} from '../types';

// type DriedAction<T extends IBaseAction> = DataOf<T> & {
//   entrypoint: IEntrypoint;
//   type: ActionQueueItem['type'];
// };

// export type GetCallbacksByAction<TAction extends ActionQueueItem> =
//   EventsHandlers<
//     TAction extends IBaseAction<infer TEvents>
//       ? TEvents
//       : Record<never, unknown>
//   >;

// export type GetCallbacksByType<TType extends ActionQueueItem['type']> =
//   GetCallbacksByAction<ActionByType<TType>>;

// export type Merger<T extends ActionQueueItem> = (
//   existAction: DriedAction<T>,
//   newAction: DriedAction<T>
// ) => MergeAction | DataOf<T>;

export const nameOf = (node: {
  type: string;
  entrypoint: {
    name: string;
  };
}): string => `${node.type}:${node.entrypoint.name}`;

const randomIds = new WeakMap<object, string>();
const randomIdFor = (obj: object) => {
  if (!randomIds.has(obj)) {
    randomIds.set(obj, nanoid(10));
  }

  return randomIds.get(obj);
};

export const keyOf = <T extends ActionQueueItem>(node: T): string => {
  const name = nameOf(node);
  switch (node.type) {
    case 'addToCodeCache':
      return `${name}:${randomIdFor(node.data)}`;

    case 'processImports':
      return `${name}:${randomIdFor(node.resolved)}`;

    case 'resolveImports':
      return node.imports ? `${name}:${randomIdFor(node.imports)}` : name;

    default:
      return name;
  }
};

// const defaultMerger = (
//   a: DriedAction<ActionQueueItem>,
//   b: DriedAction<ActionQueueItem>
// ): MergeAction => {
//   const aOnly = a.entrypoint.only;
//   const bOnly = b.entrypoint.only;
//   if (aOnly.includes('*') || bOnly.every((i) => aOnly.includes(i))) {
//     return 'keep existing';
//   }
//
//   if (bOnly.includes('*') || aOnly.every((i) => bOnly.includes(i))) {
//     return 'replace existing';
//   }
//
//   return 'reprocess';
// };

// function transferCallbacks<TEvents extends Record<string, unknown[]>>(
//   from: { callbacks?: IBaseAction['callbacks'] }[],
//   to: { callbacks?: IBaseAction['callbacks'] }
// ) {
//   const targetCallbacks = (to.callbacks as EventsHandlers<TEvents>) ?? {};
//
//   from.forEach((node) => {
//     if (!node.callbacks) return;
//
//     const callbacks = node.callbacks as EventsHandlers<TEvents>;
//     Object.keys(callbacks).forEach((key) => {
//       const name = key as keyof typeof targetCallbacks;
//       const handlers = callbacks[name];
//       if (!handlers) return;
//       if (!targetCallbacks[name]) {
//         targetCallbacks[name] = [];
//       }
//
//       handlers.forEach((handler) => {
//         if (!handler) return;
//         targetCallbacks[name]!.push(handler);
//       });
//     });
//   });
//
//   // eslint-disable-next-line no-param-reassign
//   to.callbacks = targetCallbacks;
// }

// const mergers: {
//   [K in ActionQueueItem['type']]: Merger<ActionByType<ActionQueueItem, K>>;
// } = {
//   processEntrypoint: defaultMerger,
//   resolveImports: (a, b) => {
//     const mergedImports = new Map<string, string[]>();
//     const addOrMerge = (v: string[], k: string) => {
//       const prev = mergedImports.get(k);
//       if (prev) {
//         mergedImports.set(k, Array.from(new Set([...prev, ...v])).sort());
//       } else {
//         mergedImports.set(k, v);
//       }
//     };
//
//     a.imports?.forEach(addOrMerge);
//     b.imports?.forEach(addOrMerge);
//
//     return {
//       imports: mergedImports,
//     };
//   },
//   processImports: (a, b) => {
//     const mergedResolved: IResolvedImport[] = [];
//     const addOrMerge = (v: IResolvedImport) => {
//       const prev = mergedResolved.find(
//         (i) => i.importedFile === v.importedFile
//       );
//       if (prev) {
//         prev.importsOnly = Array.from(
//           new Set([...prev.importsOnly, ...v.importsOnly])
//         ).sort();
//       } else {
//         mergedResolved.push(v);
//       }
//     };
//
//     a.resolved.forEach(addOrMerge);
//     b.resolved.forEach(addOrMerge);
//
//     return {
//       resolved: mergedResolved,
//     };
//   },
//   transform: defaultMerger,
//   addToCodeCache: defaultMerger,
//   explodeReexports: () => 'keep existing',
//   getExports: () => 'keep existing',
// };

// export const onCollide: Merger<ActionQueueItem> = (existAction, newAction) => {
//   if (existAction.type === newAction.type) {
//     return (mergers[existAction.type] as Merger<ActionQueueItem>)(
//       existAction,
//       newAction
//     );
//   }
//
//   throw new Error(
//     `Cannot merge ${nameOf(existAction)} with ${nameOf(newAction)}`
//   );
// };

// export function createCombinedAction<TType extends ActionQueueItem['type']>(
//   target: ActionByType<TType>,
//   source: {
//     next: Next<ActionQueueItem>;
//     callbacks?: Callbacks<TType>;
//   }
// ) {
//   transferCallbacks([source], target);
//
//   return target;
// }

const actionsForEntrypoints = new WeakMap<IBaseEntrypoint, Set<IBaseAction>>();
export const getRefsCount = (entrypoint: IBaseEntrypoint) =>
  actionsForEntrypoints.get(entrypoint)?.size ?? 0;

export const addRef = (entrypoint: IBaseEntrypoint, action: IBaseAction) => {
  if (!actionsForEntrypoints.has(entrypoint)) {
    actionsForEntrypoints.set(entrypoint, new Set());
  }

  actionsForEntrypoints.get(entrypoint)?.add(action);
};

function innerCreateAction<TType extends ActionQueueItem['type']>(
  actionType: TType,
  entrypoint: IBaseEntrypoint,
  data: DataOf<ActionByType<TType>>,
  abortSignal: AbortSignal | null
): ActionByType<TType> {
  type Events = (ActionByType<TType> extends IBaseAction<
    IBaseEntrypoint,
    infer TEvents
  >
    ? TEvents
    : Record<never, unknown[]>) &
    Record<string, unknown[]>;

  type Callbacks = EventsHandlers<Events>;
  const callbacks: Callbacks = {};

  const on = <T extends keyof Callbacks>(
    type: T,
    callback: (...args: Events[T]) => void
  ) => {
    if (!callback) {
      return;
    }

    if (!callbacks[type]) {
      callbacks[type] = [];
    }

    callbacks[type]!.push(callback);
  };

  const newAction = {
    ...data,
    abortSignal,
    callbacks,
    type: actionType,
    entrypoint,
    on,
  } as ActionByType<TType>;

  return newAction;
}

export function createAction<TType extends ActionQueueItem['type']>(
  actionType: TType,
  entrypoint: IBaseEntrypoint,
  data: DataOf<ActionByType<TType>>,
  abortSignal: AbortSignal | null = null
): ActionByType<TType> {
  const action = innerCreateAction(actionType, entrypoint, data, abortSignal);
  addRef(entrypoint, action);
  return action;
}
