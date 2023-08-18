/* eslint-disable no-await-in-loop */
import { EventEmitter } from '@linaria/utils';

import { TransformCacheCollection } from '../../../cache';
import { AsyncActionQueue } from '../ActionQueue';
import type { Handlers } from '../GenericActionQueue';
import { processEntrypoint } from '../actions/processEntrypoint';
import type {
  Services,
  IBaseAction,
  ITransformAction,
  IBaseServices,
  Handler,
  IExplodeReexportsAction,
} from '../types';

import { createEntrypoint } from './entrypoint-helpers';

type Res = Promise<void> | void;
type AsyncHandlers = Handlers<Promise<void> | void, IBaseServices>;
type GetHandler<T extends IBaseAction> = Handler<IBaseServices, T, Res>;

describe('AsyncActionQueue', () => {
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

  it('should emit new action in both queues', () => {
    const fooBarTransform: GetHandler<ITransformAction> = jest.fn();
    const fooBarExplodeReexports: GetHandler<IExplodeReexportsAction> =
      jest.fn();
    const fooBarQueue = createQueueFor('/foo/bar.js', {
      processEntrypoint,
      transform: fooBarTransform,
      explodeReexports: fooBarExplodeReexports,
    });
    fooBarQueue.runNext();

    const fooBazTransform: GetHandler<ITransformAction> = jest.fn();
    const fooBazExplodeReexports: GetHandler<IExplodeReexportsAction> =
      jest.fn();
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
    fooBarQueue.runNext(); // should be the explodeReexports action
    expect(fooBarExplodeReexports).toHaveBeenCalledTimes(1);
    fooBarQueue.runNext(); // should be the transform action
    expect(fooBarTransform).toHaveBeenCalledTimes(1);
    expect(fooBarQueue.isEmpty()).toBe(true);

    fooBazQueue.runNext(); // run processEntrypoint for /foo/baz.js
    expect(fooBazTransform).not.toHaveBeenCalled();
    expect(fooBazExplodeReexports).not.toHaveBeenCalled();
    fooBazQueue.runNext(); // run explodeReexports for /foo/baz.js
    expect(fooBazExplodeReexports).toHaveBeenCalledTimes(1);
    fooBazQueue.runNext(); // run transform for /foo/baz.js
    expect(fooBazTransform).toHaveBeenCalledTimes(1);
    expect(fooBazQueue.isEmpty()).toBe(true);
  });
});
