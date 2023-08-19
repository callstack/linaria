import { EventEmitter } from '@linaria/utils';

import { TransformCacheCollection } from '../../../../cache';
import {
  createEntrypoint,
  fakeLoadAndParse,
} from '../../__tests__/entrypoint-helpers';
import type { Services } from '../../types';
import { createAction } from '../action';

describe('createAction', () => {
  let services: Pick<Services, 'cache' | 'eventEmitter'>;

  beforeEach(() => {
    services = {
      cache: new TransformCacheCollection(),
      eventEmitter: EventEmitter.dummy,
    };

    fakeLoadAndParse.mockClear();
  });

  it('should create an action', () => {
    const action = createAction(
      'processEntrypoint',
      createEntrypoint(services, '/foo/bar.js', ['default']),
      {},
      null
    );

    expect(action).toMatchObject({
      type: 'processEntrypoint',
      entrypoint: {
        name: '/foo/bar.js',
        only: ['default'],
        parent: null,
      },
      abortSignal: null,
    });
  });

  it('should merge two existing actions to a new one', () => {
    const entrypoint = createEntrypoint(services, '/foo/bar.js', ['default']);

    const action1 = createAction('processEntrypoint', entrypoint, {}, null);

    const action2 = createAction('processEntrypoint', entrypoint, {}, null);

    expect(action1).not.toBe(action2);
  });
});
