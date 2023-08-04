export type OnEvent = (
  labels: Record<string, unknown>,
  type: 'start' | 'finish' | 'single',
  event?: unknown
) => void;

export class EventEmitter {
  static dummy = new EventEmitter(() => {});

  constructor(protected onEvent: OnEvent) {}

  public autoPair<TRes>(labels: Record<string, string>, fn: () => TRes) {
    this.onEvent(labels, 'start');
    const result = fn();
    if (result instanceof Promise) {
      result.then(() => this.onEvent(labels, 'finish'));
    } else {
      this.onEvent(labels, 'finish');
    }

    return result;
  }

  public pair(labels: Record<string, string>) {
    this.onEvent(labels, 'start');
    return () => {
      this.onEvent(labels, 'finish');
    };
  }

  public single(labels: Record<string, unknown>) {
    this.onEvent(labels, 'single');
  }
}
