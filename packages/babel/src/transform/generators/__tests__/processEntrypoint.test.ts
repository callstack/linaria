import {
  createEntrypoint,
  createServices,
} from '../../__tests__/entrypoint-helpers';
import type { Services } from '../../types';
import { processEntrypoint } from '../processEntrypoint';

import {
  expectIteratorReturnResult,
  expectIteratorYieldResult,
  isIteratorYieldResult,
} from './helpers';

describe('processEntrypoint', () => {
  let services: Services;
  beforeEach(() => {
    services = createServices();
  });

  it('should emit explodeReexports, transform and finalizeEntrypoint actions', () => {
    const fooBarDefault = createEntrypoint(services, '/foo/bar.js', [
      'default',
    ]);

    // const action = createAction('processEntrypoint', fooBarDefault, {}, null);
    const action = fooBarDefault.createAction(
      'processEntrypoint',
      undefined,
      null
    );
    const gen = processEntrypoint.call(action);

    let result = gen.next();
    expectIteratorYieldResult(result);

    expect(result.value[0]).toBe('explodeReexports');
    expect(result.value[1]).toBe(fooBarDefault);

    result = gen.next();
    expectIteratorYieldResult(result);
    expect(result.value[0]).toBe('transform');
    expect(result.value[1]).toBe(fooBarDefault);

    expectIteratorReturnResult(gen.next(), undefined);
  });

  it('should abort previously emitted actions if entrypoint was superseded and emit a new processEntrypoint', () => {
    const fooBarDefault = createEntrypoint(services, '/foo/bar.js', [
      'default',
    ]);

    const action = fooBarDefault.createAction(
      'processEntrypoint',
      undefined,
      null
    );
    const gen = processEntrypoint.call(action);

    const emitted = [gen.next(), gen.next()]
      .filter(isIteratorYieldResult)
      .map((result) => result.value);
    expect(emitted[0][0]).toBe('explodeReexports');
    expect(emitted[1][0]).toBe('transform');

    const emittedSignals = emitted.map((a) => a[3]);
    expect(emittedSignals.map((signal) => signal?.aborted)).toEqual([
      false,
      false,
    ]);

    const supersededWith = createEntrypoint(services, '/foo/bar.js', ['named']);
    expect(emittedSignals.map((signal) => signal?.aborted)).toEqual([
      true,
      true,
    ]);

    const nextResult = gen.next();
    expectIteratorYieldResult(nextResult);
    expect(nextResult.value[0]).toBe('processEntrypoint');
    expect(nextResult.value[1]).toBe(supersededWith);
  });

  it('should abort previously emitted actions if parent aborts', () => {
    const fooBarDefault = createEntrypoint(services, '/foo/bar.js', [
      'default',
    ]);

    const abortController = new AbortController();
    const action = fooBarDefault.createAction(
      'processEntrypoint',
      undefined,
      abortController.signal
    );
    const gen = processEntrypoint.call(action);

    const emitted = [gen.next(), gen.next()]
      .filter(isIteratorYieldResult)
      .map((result) => result.value);
    expect(emitted[0][0]).toBe('explodeReexports');
    expect(emitted[1][0]).toBe('transform');

    const emittedSignals = emitted.map((a) => a[3]);
    expect(emittedSignals.map((signal) => signal?.aborted)).toEqual([
      false,
      false,
    ]);

    abortController.abort();

    expect(emittedSignals.map((signal) => signal?.aborted)).toEqual([
      true,
      true,
    ]);

    expectIteratorReturnResult(gen.next(), undefined);
  });
});
