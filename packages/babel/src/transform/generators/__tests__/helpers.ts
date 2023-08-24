export function isIteratorReturnResult<T, TReturn>(
  result: IteratorResult<T, TReturn>
): result is IteratorReturnResult<TReturn> {
  return result.done === true;
}

export function isIteratorYieldResult<T, TReturn>(
  result: IteratorResult<T, TReturn>
): result is IteratorYieldResult<T> {
  return result.done !== true;
}

export function expectIteratorReturnResult<T, TReturn>(
  result: IteratorResult<T, TReturn>,
  ...args: [] | [TReturn]
): asserts result is IteratorReturnResult<TReturn> {
  expect(isIteratorReturnResult(result)).toBe(true);
  if (args.length > 0) {
    expect(result.value).toBe(args[0]);
  }
}

export function expectIteratorYieldResult<T, TReturn>(
  result: IteratorResult<T, TReturn>
): asserts result is IteratorYieldResult<T> {
  expect(isIteratorYieldResult(result)).toBe(true);
}
