/* eslint-disable no-await-in-loop */
import { EventEmitter } from '@linaria/utils';

import { TransformCacheCollection } from '../../../cache';
import { AsyncActionQueue } from '../ActionQueue';
import type { Handlers } from '../GenericActionQueue';
import type {
  Services,
  IBaseAction,
  IProcessEntrypointAction,
  ITransformAction,
  IBaseServices,
  Handler,
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
    const processEntrypoint = () => Promise.resolve();
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
    const onProcessEntrypoint = jest.fn();
    const processEntrypoint: GetHandler<IProcessEntrypointAction> = (
      _services,
      action,
      next
    ) => {
      next('transform', action.entrypoint, {});
      onProcessEntrypoint(action);
    };

    const fooBarTransform: GetHandler<ITransformAction> = jest.fn();
    const fooBarQueue = createQueueFor('/foo/bar.js', {
      processEntrypoint,
      transform: fooBarTransform,
    });

    const fooBazTransform: GetHandler<ITransformAction> = jest.fn();
    const fooBazQueue = createQueueFor('/foo/baz.js', {
      processEntrypoint,
      transform: fooBazTransform,
    });
    createEntrypoint(services, '/foo/bar.js', ['Bar']);

    // At that point, both queues should have the same processEntrypoint action for /foo/bar.js
    // If we run this merged action in one queue, it should emit a new `transform` action in both queues
    fooBarQueue.runNext();

    // Drain fooBarQueue
    expect(fooBarTransform).not.toHaveBeenCalled();
    fooBarQueue.runNext(); // should be the transform action
    expect(fooBarTransform).toHaveBeenCalledTimes(1);
    expect(fooBarQueue.isEmpty()).toBe(true);

    fooBazQueue.runNext(); // run processEntrypoint for /foo/baz.js
    expect(fooBazTransform).not.toHaveBeenCalled();
    fooBazQueue.runNext(); // run processEntrypoint for /foo/bar.js
  });

  it('should call handlers of each merged action in original context', () => {});
});
