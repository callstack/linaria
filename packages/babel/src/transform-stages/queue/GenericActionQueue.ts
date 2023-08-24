// import { relative, sep } from 'path';
//
// import type { Debugger } from '@linaria/logger';
//
// import type { IBaseEntrypoint } from '../../types';
//
// import { PriorityQueue } from './PriorityQueue';
// import {
//   createAction,
//   getRefsCount,
//   getWeight,
//   isContinuation,
//   keyOf,
// } from './actions/action';
// import { actionRunner } from './actions/actionRunner';
// import type {
//   TypeOfData,
//   ActionByType,
//   IBaseAction,
//   IBaseServices,
//   Handler,
//   AnyActionGenerator,
//   Continuation,
//   GetGeneratorForRes,
// } from './types';
//
// function hasLessPriority(
//   a: IBaseAction | Continuation,
//   b: IBaseAction | Continuation
// ) {
//   if (isContinuation(a) || isContinuation(b)) {
//     const weightA = getWeight(a);
//     const weightB = getWeight(b);
//     if (weightA !== weightB) {
//       return getWeight(a) < getWeight(b);
//     }
//
//     if (isContinuation(a) && isContinuation(b)) {
//       // Newer continuations have higher priority
//       return a.uid < b.uid;
//     }
//
//     return hasLessPriority(
//       'action' in a ? a.action : a,
//       'action' in b ? b.action : b
//     );
//   }
//
//   if (a.type === b.type) {
//     const parentA = a.entrypoint.parent?.name;
//     const parentB = b.entrypoint.parent?.name;
//     const refCountA = getRefsCount(a.entrypoint);
//     const refCountB = getRefsCount(b.entrypoint);
//     if (refCountA === refCountB && parentA && parentB) {
//       const distanceA = relative(parentA, a.entrypoint.name).split(sep).length;
//       const distanceB = relative(parentB, b.entrypoint.name).split(sep).length;
//       return distanceA > distanceB;
//     }
//
//     return refCountA > refCountB;
//   }
//
//   return getWeight(a) < getWeight(b);
// }
//
// export type Handlers<
//   TRes extends AnyActionGenerator,
//   TServices extends IBaseServices,
// > = {
//   [K in ActionQueueItem['type']]: Handler<TServices, ActionByType<K>, TRes>;
// };
//
// export class GenericActionQueue<
//   TRes extends Promise<void> | void,
//   TServices extends IBaseServices,
// > extends PriorityQueue<ActionQueueItem | Continuation> {
//   protected readonly queueIdx: string;
//
//   protected readonly log: Debugger;
//
//   protected readonly processed = new WeakMap<IBaseEntrypoint, Set<string>>();
//
//   public get logRef() {
//     return {
//       namespace: this.log.namespace,
//       text: `queue:${this.queueIdx}`,
//     };
//   }
//
//   constructor(
//     protected services: TServices,
//     protected handlers: Handlers<
//       GetGeneratorForRes<TRes, ActionQueueItem>,
//       TServices
//     >,
//     entrypoint: IBaseEntrypoint
//   ) {
//     super(hasLessPriority);
//
//     this.log = entrypoint.log.extend('queue');
//
//     this.log('Created for entrypoint %s', entrypoint.name);
//     this.queueIdx = entrypoint.idx;
//   }
//
//   protected override dequeue(): ActionQueueItem | Continuation | undefined {
//     let action: ActionQueueItem | Continuation | undefined;
//     // eslint-disable-next-line no-cond-assign
//     while ((action = super.dequeue())) {
//       if (!action?.abortSignal?.aborted) {
//         this.log('Dequeued %s: %O', keyOf(action), this.data.map(keyOf));
//
//         return action;
//       }
//
//       this.log('%s was aborted', keyOf(action));
//     }
//
//     return undefined;
//   }
//
//   protected override enqueue(newAction: ActionQueueItem | Continuation) {
//     const key = keyOf(newAction);
//     const { entrypoint, type } = isContinuation(newAction)
//       ? newAction.action
//       : newAction;
//
//     if (!this.processed.has(entrypoint)) {
//       this.processed.set(entrypoint, new Set());
//     }
//
//     const processed = this.processed.get(entrypoint)!;
//     if (processed.has(key)) {
//       this.log('Skip %s because it was already processed', key);
//       return;
//     }
//
//     const onAbort = () => {
//       this.services.eventEmitter.single({
//         type: 'queue-action',
//         queueIdx: this.queueIdx,
//         action: `${type}:abort`,
//         file: entrypoint.name,
//         args: entrypoint.only,
//       });
//       this.delete(newAction);
//     };
//
//     newAction.abortSignal?.addEventListener('abort', onAbort);
//
//     super.enqueue(newAction, () => {
//       newAction.abortSignal?.removeEventListener('abort', onAbort);
//     });
//
//     if (!isContinuation(newAction) && newAction.type === 'processEntrypoint') {
//       newAction.entrypoint.onSupersede((newEntrypoint) => {
//         this.next('processEntrypoint', newEntrypoint, {});
//       });
//     }
//
//     processed.add(key);
//     this.log('Enqueued %s: %O', key, this.data.map(keyOf));
//   }
//
//   public next = <TType extends ActionQueueItem['type']>(
//     actionType: TType,
//     entrypoint: IBaseEntrypoint,
//     data: TypeOfData<ActionByType<TType>>,
//     abortSignal: AbortSignal | null = null
//   ): ActionByType<TType> => {
//     const action = createAction(actionType, entrypoint, data, abortSignal);
//
//     this.enqueue(action);
//
//     return action;
//   };
//
//   protected handle<TAction extends ActionQueueItem>(
//     action: TAction | Continuation<TAction>
//   ): TRes {
//     if (isContinuation(action)) {
//       return actionRunner(
//         this.services,
//         this.enqueue.bind(this),
//         action,
//         this.queueIdx
//       );
//     }
//
//     const handler = this.handlers[action.type as TAction['type']] as Handler<
//       TServices,
//       TAction,
//       GetGeneratorForRes<TRes, TAction>
//     >;
//
//     return actionRunner(
//       this.services,
//       this.enqueue.bind(this),
//       action,
//       this.queueIdx,
//       handler
//     );
//   }
// }
