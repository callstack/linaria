import { EventEmitter } from '@linaria/utils';

import { TransformCacheCollection } from '../../../../cache';
import {
  createEntrypoint,
  fakeLoadAndParse,
} from '../../__tests__/entrypoint-helpers';
import { createAction } from '../../actions/action';
import type { Next, Services } from '../../types';
import { finalizeEntrypoint } from '../finalizeEntrypoint';

describe('finalizeEntrypoint', () => {
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

  it('should call finalizer', async () => {
    const fooBarDefault = createEntrypoint(services, '/foo/bar.js', [
      'default',
    ]);

    const finalizer = jest.fn();
    const action = createAction(
      'finalizeEntrypoint',
      fooBarDefault,
      {
        finalizer,
      },
      null
    );

    const gen = finalizeEntrypoint(services, action);

    const result: IteratorResult<Parameters<Next>, void> = gen.next();

    expect(result.done).toBe(true);
    expect(finalizer).toHaveBeenCalled();
  });

  xit('should re-emit processEntrypoint if entrypoint was superseded', async () => {
    const fooBarDefault = createEntrypoint(services, '/foo/bar.js', [
      'default',
    ]);

    const finalizer = jest.fn();
    const action = createAction(
      'finalizeEntrypoint',
      fooBarDefault,
      {
        finalizer,
      },
      null
    );

    const gen = finalizeEntrypoint(services, action);
    const fooBarNamed = createEntrypoint(services, '/foo/bar.js', ['named']);

    expect(gen.next().value).toEqual([
      'processEntrypoint',
      fooBarNamed,
      {},
      null,
    ]);

    expect(gen.next()).toEqual({ done: true, value: undefined });
  });
});
