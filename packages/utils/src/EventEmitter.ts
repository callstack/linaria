export type OnEvent = (
  labels: Record<string, unknown>,
  type: 'start' | 'finish' | 'single',
  event?: unknown
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
    () => 0
  );

  constructor(
    protected onEvent: OnEvent,
    protected onAction: OnAction
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
    const result = fn();
    if (result instanceof Promise) {
      result.then(
        () => this.onAction('finish', performance.now(), id, true),
        () => this.onAction('fail', performance.now(), id, true)
      );
    } else {
      this.onAction('finish', performance.now(), id, false);
    }

    return result;
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
