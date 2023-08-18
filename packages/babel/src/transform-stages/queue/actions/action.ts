import { nanoid } from 'nanoid';

import type { IBaseEntrypoint } from '../../../types';
import type {
  ActionQueueItem,
  IBaseAction,
  DataOf,
  EventsHandlers,
  ActionByType,
} from '../types';

const randomIds = new WeakMap<object, string>();
const randomIdFor = (obj: object) => {
  if (!randomIds.has(obj)) {
    randomIds.set(obj, nanoid(10));
  }

  return randomIds.get(obj);
};

export const keyOf = <T extends ActionQueueItem>(node: T): string => {
  const name = `${node.type}:${node.entrypoint.name}`;
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

  return {
    ...data,
    abortSignal,
    callbacks,
    type: actionType,
    entrypoint,
    on,
  } as ActionByType<TType>;
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
