import type { Entrypoint } from '../Entrypoint';

export class UnprocessedEntrypointError extends Error {
  constructor(public entrypoint: Entrypoint) {
    super(
      `Entrypoint ${entrypoint.idx} is not processed and can't be evaluated`
    );
  }
}

export const isUnprocessedEntrypointError = (
  value: unknown
): value is UnprocessedEntrypointError =>
  value instanceof UnprocessedEntrypointError;
