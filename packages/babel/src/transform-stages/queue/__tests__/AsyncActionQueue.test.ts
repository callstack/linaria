/* eslint-disable no-await-in-loop */
import { EventEmitter } from '@linaria/utils';

import { TransformCacheCollection } from '../../../cache';
import { AsyncActionQueue } from '../ActionQueue';
import type { Handlers } from '../GenericActionQueue';
import { processEntrypoint } from '../generators/processEntrypoint';
import type {
  Services,
  IBaseAction,
  ITransformAction,
  IBaseServices,
  Handler,
  IExplodeReexportsAction,
  ActionGenerator,
  ActionQueueItem,
  AnyActionGenerator,
} from '../types';

import { createEntrypoint } from './entrypoint-helpers';

type Res = AnyActionGenerator;
type AsyncHandlers = Handlers<Res, IBaseServices>;
type GetHandler<T extends IBaseAction> = Handler<IBaseServices, T, Res>;

describe('AsyncActionQueue', () => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  function* emptyHandler(): ActionGenerator<ActionQueueItem> {}

  async function drainQueue(
    queue: AsyncActionQueue<Pick<Services, 'cache' | 'eventEmitter'>>
  ) {
    while (!queue.isEmpty()) {
      await queue.runNext();
    }
  }

  let services: Pick<Services, 'cache' | 'eventEmitter'>;
  let handlers: AsyncHandlers;
  beforeEach(() => {
    handlers = {
      addToCodeCache: jest.fn(emptyHandler),
      explodeReexports: jest.fn(emptyHandler),
      finalizeEntrypoint: jest.fn(emptyHandler),
      getExports: jest.fn(emptyHandler),
      processEntrypoint: jest.fn(emptyHandler),
      processImports: jest.fn(emptyHandler),
      resolveImports: jest.fn(emptyHandler),
      transform: jest.fn(emptyHandler),
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
    const fooBarQueue = createQueueFor('/foo/bar.js', {
      processEntrypoint,
    });
    const fooBazQueue = createQueueFor('/foo/baz.js', {
      processEntrypoint,
    });
    const fooBarEntry = createEntrypoint(services, '/foo/bar.js', ['default']);
    fooBazQueue.next('processEntrypoint', fooBarEntry, {});

    fooBazQueue.runNext(); // pop processEntrypoint for /foo/baz.js

    // both queues should now have the same processEntrypoint action for /foo/bar.js
    expect(fooBarQueue.runNext()).toBe(fooBazQueue.runNext());
  });

  it('should emit new action in both queues', async () => {
    const fooBarTransform: GetHandler<ITransformAction> = jest.fn(emptyHandler);
    const fooBarExplodeReexports: GetHandler<IExplodeReexportsAction> =
      jest.fn(emptyHandler);
    const fooBarQueue = createQueueFor('/foo/bar.js', {
      processEntrypoint,
      transform: fooBarTransform,
      explodeReexports: fooBarExplodeReexports,
    });
    fooBarQueue.runNext(); // yield explodeReexports
    fooBarQueue.runNext(); // yield transform
    fooBarQueue.runNext(); // yield finalizeEntrypoint

    const fooBazTransform: GetHandler<ITransformAction> = jest.fn(emptyHandler);
    const fooBazExplodeReexports: GetHandler<IExplodeReexportsAction> =
      jest.fn(emptyHandler);
    const fooBazQueue = createQueueFor('/foo/baz.js', {
      processEntrypoint,
      transform: fooBazTransform,
      explodeReexports: fooBazExplodeReexports,
    });
    createEntrypoint(services, '/foo/bar.js', ['Bar']);

    // At that point, both queues should have the same processEntrypoint action for /foo/bar.js
    // If we run this merged action in one queue, it should emit a new `transform` action in both queues
    fooBarQueue.runNext();

    // Drain fooBarQueue
    expect(fooBarTransform).not.toHaveBeenCalled();
    await drainQueue(fooBarQueue);

    expect(fooBarExplodeReexports).toHaveBeenCalledTimes(1);
    expect(fooBarTransform).toHaveBeenCalledTimes(1);
    expect(fooBarQueue.isEmpty()).toBe(true);

    expect(fooBazTransform).not.toHaveBeenCalled();
    expect(fooBazExplodeReexports).not.toHaveBeenCalled();
    await drainQueue(fooBazQueue);
    expect(fooBazExplodeReexports).toHaveBeenCalledTimes(1);
    expect(fooBazTransform).toHaveBeenCalledTimes(1);
    expect(fooBazQueue.isEmpty()).toBe(true);
  });
});
