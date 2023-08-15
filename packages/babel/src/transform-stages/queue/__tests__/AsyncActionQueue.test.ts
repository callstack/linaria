/* eslint-disable no-await-in-loop */
import { enableDebug } from '@linaria/logger';
import { EventEmitter } from '@linaria/utils';

import { TransformCacheCollection } from '../../../cache';
import { AsyncActionQueue } from '../ActionQueue';
import type { Handlers, IBaseServices } from '../GenericActionQueue';
import type { Services } from '../types';

import { createEntrypoint } from './entrypoint-helpers';

type AsyncHandlers = Handlers<Promise<void> | void, IBaseServices>;

describe('AsyncActionQueue', () => {
  enableDebug();

  let services: Pick<Services, 'cache' | 'eventEmitter'>;
  let handlers: AsyncHandlers;
  beforeEach(() => {
    handlers = {
      addToCodeCache: jest.fn(),
      transform: jest.fn(),
      explodeReexports: jest.fn(),
      processEntrypoint: jest.fn(),
      processImports: jest.fn(),
      getExports: jest.fn(),
      resolveImports: jest.fn(),
    };

    services = {
      cache: new TransformCacheCollection(),
      eventEmitter: EventEmitter.dummy,
    };
  });

  const createQueueFor = (
    name: string,
    customHandlers: Partial<AsyncHandlers> = {}
  ) => {
    const entrypoint = createEntrypoint(services, name, ['default']);
    return new AsyncActionQueue(
      services,
      { ...handlers, ...customHandlers },
      entrypoint
    );
  };

  it('should merge actions', () => {
    const fooBarQueue = createQueueFor('/foo/bar.js');
    const fooBazQueue = createQueueFor('/foo/baz.js');
    const fooBarEntry = createEntrypoint(services, '/foo/bar.js', ['Bar']);
    fooBazQueue.next('processEntrypoint', fooBarEntry, {});

    fooBazQueue.runNext(); // pop processEntrypoint for /foo/baz.js

    // both queues should now have the same processEntrypoint action for /foo/bar.js
    expect(fooBarQueue.runNext()).toBe(fooBazQueue.runNext());
  });
});
