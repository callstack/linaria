import { EventEmitter } from '@linaria/utils';

import { TransformCacheCollection } from '../../../../cache';
import {
  createEntrypoint,
  fakeLoadAndParse,
} from '../../__tests__/entrypoint-helpers';
import type { Services, Next } from '../../types';
import { createAction } from '../action';

describe('createAction', () => {
  let services: Pick<Services, 'cache' | 'eventEmitter'>;
  const nextNext = jest.fn();
  const next = jest.fn<ReturnType<Next>, Parameters<Next>>((type, ep, data) =>
    createAction(type, ep, data, null, nextNext)
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

  it('should create an action', () => {
    const action = createAction(
      'processEntrypoint',
      createEntrypoint(services, '/foo/bar.js', ['default']),
      {},
      null,
      next as Next
    );

    expect(action).toMatchObject({
      type: 'processEntrypoint',
      entrypoint: {
        name: '/foo/bar.js',
        only: ['default'],
        parent: null,
      },
      callbacks: {},
      abortSignal: null,
    });
  });

  it('should create an action with callbacks', () => {
    const action = createAction(
      'transform',
      createEntrypoint(services, '/foo/bar.js', ['default']),
      {},
      null,
      next as Next
    );
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    action.on('done', cb1);
    action.on('done', cb2);
    expect(action.callbacks).toMatchObject({
      done: [cb1, cb2],
    });
  });
});
