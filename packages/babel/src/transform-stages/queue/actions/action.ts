import { nanoid } from 'nanoid';

import type { IBaseEntrypoint } from '../../../types';
import type {
  ActionQueueItem,
  IBaseAction,
  DataOf,
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

export function createAction<TType extends ActionQueueItem['type']>(
  actionType: TType,
  entrypoint: IBaseEntrypoint,
  data: DataOf<ActionByType<TType>>,
  abortSignal: AbortSignal | null = null
): ActionByType<TType> {
  const action = {
    ...data,
    abortSignal,
    type: actionType,
    entrypoint,
  } as ActionByType<TType>;
  addRef(entrypoint, action);
  return action;
}
