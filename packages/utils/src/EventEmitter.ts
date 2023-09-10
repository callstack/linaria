export type OnEvent = (
  labels: Record<string, unknown>,
  type: 'start' | 'finish' | 'single',
  event?: unknown
) => void;

export interface IActionCreated {
  actionIdx: string;
  actionType: string;
  type: 'actionCreated';
}

export interface ICreatedEvent {
  class: string;
  evaluatedOnly: string[];
  filename: string;
  generation: number;
  idx: string;
  isExportsInherited: boolean;
  only: string[];
  parentId: number | null;
  type: 'created';
}

export interface ISupersededEvent {
  type: 'superseded';
  with: number;
}

export interface ISetTransformResultEvent {
  isNull: boolean;
  type: 'setTransformResult';
}

export type EntrypointEvent =
  | IActionCreated
  | ICreatedEvent
  | ISupersededEvent
  | ISetTransformResultEvent;

export type OnEntrypointEvent = (
  idx: number,
  timestamp: number,
  event: EntrypointEvent
) => void;

export type OnActionStartArgs = [
  phase: 'start',
  timestamp: number,
  type: string,
  idx: string,
  entrypointRef: string,
];

export type OnActionFinishArgs = [
  phase: 'finish' | 'fail',
  timestamp: number,
  id: number,
  isAsync: boolean,
  error?: unknown,
];

export const isOnActionStartArgs = (
  args: OnActionStartArgs | OnActionFinishArgs
): args is OnActionStartArgs => {
  return args[0] === 'start';
};

export const isOnActionFinishArgs = (
  args: OnActionStartArgs | OnActionFinishArgs
): args is OnActionFinishArgs => {
  return args[0] === 'finish' || args[0] === 'fail';
};

export interface OnAction {
  (...args: OnActionStartArgs): number;
  (...args: OnActionFinishArgs): void;
}

export class EventEmitter {
  static dummy = new EventEmitter(
    () => {},
    () => 0,
    () => {}
  );

  constructor(
    protected onEvent: OnEvent,
    protected onAction: OnAction,
    protected onEntrypointEvent: OnEntrypointEvent
  ) {}

  public action<TRes>(
    actonType: string,
    idx: string,
    entrypointRef: string,
    fn: () => TRes
  ) {
    const id = this.onAction(
      'start',
      performance.now(),
      actonType,
      idx,
      entrypointRef
    );

    try {
      const result = fn();
      if (result instanceof Promise) {
        result.then(
          () => this.onAction('finish', performance.now(), id, true),
          (e) => this.onAction('fail', performance.now(), id, true, e)
        );
      } else {
        this.onAction('finish', performance.now(), id, false);
      }

      return result;
    } catch (e) {
      this.onAction('fail', performance.now(), id, false, e);
      throw e;
    }
  }

  public entrypointEvent(sequenceId: number, event: EntrypointEvent) {
    this.onEntrypointEvent(sequenceId, performance.now(), event);
  }

  public perf<TRes>(method: string, fn: () => TRes): TRes {
    const labels = { method };

    this.onEvent(labels, 'start');

    const result = fn();
    if (result instanceof Promise) {
      result.then(
        () => this.onEvent(labels, 'finish'),
        () => this.onEvent(labels, 'finish')
      );
    } else {
      this.onEvent(labels, 'finish');
    }

    return result;
  }

  public single(labels: Record<string, unknown>) {
    this.onEvent(
      {
        ...labels,
        datetime: new Date(),
      },
      'single'
    );
  }
}
