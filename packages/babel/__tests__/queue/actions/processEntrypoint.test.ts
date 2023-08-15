import { EventEmitter } from '@linaria/utils';

import { TransformCacheCollection } from '../../../src';
import { createAction } from '../../../src/transform-stages/queue/actions/action';
import { processEntrypoint } from '../../../src/transform-stages/queue/actions/processEntrypoint';
import type { Next, Services } from '../../../src/transform-stages/queue/types';
import { createEntrypoint, fakeLoadAndParse } from '../entrypoint-helpers';

describe('processEntrypoint', () => {
  let services: Pick<Services, 'cache' | 'eventEmitter'>;
  const nextNext = jest.fn();
  const next = jest.fn<ReturnType<Next>, Parameters<Next>>((type, ep, data) =>
    createAction(type, ep, data, nextNext)
  );

  beforeEach(() => {
    services = {
      cache: new TransformCacheCollection(),
      eventEmitter: EventEmitter.dummy,
    };

    fakeLoadAndParse.mockClear();
    next.mockClear();
    nextNext.mockClear();
  });

  it('should emit explodeReexports and transform actions', async () => {
    const fooBarDefault = createEntrypoint(services, '/foo/bar.js', [
      'default',
    ]);

    const action = createAction(
      'processEntrypoint',
      fooBarDefault,
      {},
      next as Next
    );

    processEntrypoint(services, action);

    expect(next).toHaveBeenCalledTimes(2);
    expect(next).toHaveBeenNthCalledWith(
      1,
      'explodeReexports',
      fooBarDefault,
      {}
    );

    expect(next).toHaveBeenNthCalledWith(2, 'transform', fooBarDefault, {});
  });

  it('should re-emit processEntrypoint if entrypoint was superseded', async () => {
    const fooBarDefault = createEntrypoint(services, '/foo/bar.js', [
      'default',
    ]);

    const action = createAction(
      'processEntrypoint',
      fooBarDefault,
      {},
      next as Next
    );

    processEntrypoint(services, action);

    expect(next).toHaveBeenCalledTimes(2);

    const fooBarNamed = createEntrypoint(services, '/foo/bar.js', ['named']);

    expect(next).toHaveBeenCalledTimes(3);
    expect(next).toHaveBeenLastCalledWith('processEntrypoint', fooBarNamed, {});
  });
});
