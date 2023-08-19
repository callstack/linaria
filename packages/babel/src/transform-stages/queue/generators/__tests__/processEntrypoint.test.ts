import { EventEmitter } from '@linaria/utils';

import { TransformCacheCollection } from '../../../../cache';
import {
  createEntrypoint,
  fakeLoadAndParse,
} from '../../__tests__/entrypoint-helpers';
import { createAction } from '../../actions/action';
import type { Next, Services } from '../../types';
import { processEntrypoint } from '../processEntrypoint';

describe('processEntrypoint', () => {
  let services: Pick<Services, 'cache' | 'eventEmitter'>;
  const next = jest.fn<ReturnType<Next>, Parameters<Next>>((type, ep, data) =>
    createAction(type, ep, data, null)
  );

  beforeEach(() => {
    services = {
      cache: new TransformCacheCollection(),
      eventEmitter: EventEmitter.dummy,
    };

    fakeLoadAndParse.mockClear();
    next.mockClear();
  });

  it('should emit explodeReexports, transform and finalizeEntrypoint actions', async () => {
    const fooBarDefault = createEntrypoint(services, '/foo/bar.js', [
      'default',
    ]);

    const action = createAction('processEntrypoint', fooBarDefault, {}, null);

    const gen = processEntrypoint(services, action);

    let result: IteratorResult<Parameters<Next>, void>;

    result = gen.next();
    expect(result.value).toEqual([
      'explodeReexports',
      fooBarDefault,
      {},
      expect.any(AbortSignal),
    ]);
    expect(result.done).toBe(false);

    result = gen.next();
    expect(result.value).toEqual([
      'transform',
      fooBarDefault,
      {},
      expect.any(AbortSignal),
    ]);
    expect(result.done).toBe(false);

    result = gen.next();
    expect(result.value).toEqual([
      'finalizeEntrypoint',
      fooBarDefault,
      {
        finalizer: expect.any(Function),
      },
      null,
    ]);
    expect(result.done).toBe(false);

    expect(gen.next()).toEqual({ done: true, value: undefined });
  });

  it('should abort previously emitted actions if entrypoint was superseded', async () => {
    const fooBarDefault = createEntrypoint(services, '/foo/bar.js', [
      'default',
    ]);

    const action = createAction('processEntrypoint', fooBarDefault, {}, null);

    const gen = processEntrypoint(services, action);

    const emitted = [gen.next().value!, gen.next().value!];
    expect(emitted[0][0]).toEqual('explodeReexports');
    expect(emitted[1][0]).toEqual('transform');

    const emittedSignals = emitted.map(([, , , abortSignal]) => abortSignal);
    expect(emittedSignals.map((signal) => signal?.aborted)).toEqual([
      false,
      false,
    ]);

    createEntrypoint(services, '/foo/bar.js', ['named']);
    expect(emittedSignals.map((signal) => signal?.aborted)).toEqual([
      true,
      true,
    ]);

    expect(gen.next().value).toEqual([
      'finalizeEntrypoint',
      fooBarDefault,
      {
        finalizer: expect.any(Function),
      },
      null,
    ]);

    expect(gen.next()).toEqual({ done: true, value: undefined });
  });

  it('should abort previously emitted actions if parent aborts', async () => {
    const fooBarDefault = createEntrypoint(services, '/foo/bar.js', [
      'default',
    ]);

    const abortController = new AbortController();
    const action = createAction(
      'processEntrypoint',
      fooBarDefault,
      {},
      abortController.signal
    );

    const gen = processEntrypoint(services, action);

    const emitted = [gen.next().value!, gen.next().value!];
    expect(emitted[0][0]).toEqual('explodeReexports');
    expect(emitted[1][0]).toEqual('transform');

    const emittedSignals = emitted.map(([, , , abortSignal]) => abortSignal);
    expect(emittedSignals.map((signal) => signal?.aborted)).toEqual([
      false,
      false,
    ]);

    abortController.abort();

    expect(emittedSignals.map((signal) => signal?.aborted)).toEqual([
      true,
      true,
    ]);

    expect(gen.next().value).toEqual([
      'finalizeEntrypoint',
      fooBarDefault,
      {
        finalizer: expect.any(Function),
      },
      null,
    ]);

    expect(gen.next()).toEqual({ done: true, value: undefined });
  });
});
