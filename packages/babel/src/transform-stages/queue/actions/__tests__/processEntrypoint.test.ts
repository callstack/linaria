import { EventEmitter } from '@linaria/utils';

import { TransformCacheCollection } from '../../../../cache';
import {
  createEntrypoint,
  fakeLoadAndParse,
} from '../../__tests__/entrypoint-helpers';
import type { Next, Services } from '../../types';
import { createAction } from '../action';
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

  it('should emit explodeReexports and transform actions', async () => {
    const fooBarDefault = createEntrypoint(services, '/foo/bar.js', [
      'default',
    ]);

    const action = createAction('processEntrypoint', fooBarDefault, {}, null);

    processEntrypoint(services, action, next as Next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(next).toHaveBeenNthCalledWith(
      1,
      'explodeReexports',
      fooBarDefault,
      {},
      expect.any(AbortSignal)
    );

    expect(next).toHaveBeenNthCalledWith(
      2,
      'transform',
      fooBarDefault,
      {},
      expect.any(AbortSignal)
    );
  });

  it('should re-emit processEntrypoint if entrypoint was superseded', async () => {
    const fooBarDefault = createEntrypoint(services, '/foo/bar.js', [
      'default',
    ]);

    const action = createAction('processEntrypoint', fooBarDefault, {}, null);

    processEntrypoint(services, action, next as Next);

    expect(next).toHaveBeenCalledTimes(2);

    const fooBarNamed = createEntrypoint(services, '/foo/bar.js', ['named']);

    expect(next).toHaveBeenCalledTimes(3);
    expect(next).toHaveBeenLastCalledWith(
      'processEntrypoint',
      fooBarNamed,
      {},
      null
    );
  });

  it('should abort previously emitted actions if entrypoint was superseded', async () => {
    const fooBarDefault = createEntrypoint(services, '/foo/bar.js', [
      'default',
    ]);

    const action = createAction('processEntrypoint', fooBarDefault, {}, null);

    processEntrypoint(services, action, next as Next);

    expect(next).toHaveBeenCalledTimes(2);
    const emitted = next.mock.calls.map(([, , , abortSignal]) => abortSignal);
    expect(emitted.map((signal) => signal?.aborted)).toEqual([false, false]);

    const fooBarNamed = createEntrypoint(services, '/foo/bar.js', ['named']);
    expect(emitted.map((signal) => signal?.aborted)).toEqual([true, true]);

    expect(next).toHaveBeenCalledTimes(3);
    expect(next).toHaveBeenLastCalledWith(
      'processEntrypoint',
      fooBarNamed,
      {},
      null
    );
  });
});
