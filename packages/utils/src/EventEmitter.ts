export class EventEmitter {
  static dummy = new EventEmitter(() => {});

  constructor(
    protected onEvent: (
      labels: Record<string, unknown>,
      type: 'start' | 'finish' | 'single',
      event?: unknown
    ) => void
  ) {}

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
