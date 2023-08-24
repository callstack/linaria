export class AbortError extends Error {
  constructor(reason?: string) {
    super(reason);
    this.name = 'AbortError';
  }
}

export const isAborted = (value: unknown): value is AbortError =>
  value instanceof AbortError;
