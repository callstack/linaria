/* eslint-disable no-await-in-loop */
import { EventEmitter, getFileIdx } from '@linaria/utils';

import type { IBaseEntrypoint } from '../../../types';
import { AsyncActionQueue, SyncActionQueue } from '../ActionQueue';
import type { Handlers } from '../GenericActionQueue';
import { rootLog } from '../rootLog';
import type {
  Handler,
  IBaseAction,
  IBaseServices,
  IGetExportsAction,
  IProcessEntrypointAction,
} from '../types';

const createEntrypoint = (name: string): IBaseEntrypoint => ({
  name,
  idx: getFileIdx(name).toString().padStart(5, '0'),
  only: ['default'],
  log: rootLog,
  parent: null,
});

type Res = Promise<void> | void;
type UniversalHandlers = Handlers<Res, IBaseServices>;

type GetHandler<T extends IBaseAction> = Handler<IBaseServices, T, Res>;

type Queues = typeof AsyncActionQueue | typeof SyncActionQueue;

describe.each<[string, Queues]>([
  ['AsyncActionQueue', AsyncActionQueue],
  ['SyncActionQueue', SyncActionQueue],
])('%s', (_name, Queue) => {
  let services: IBaseServices;
  let handlers: UniversalHandlers;
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
      eventEmitter: EventEmitter.dummy,
    };
  });

  const createQueueFor = (
    name: string,
    customHandlers: Partial<UniversalHandlers> = {}
  ) => {
    const entrypoint = createEntrypoint(name);
    return new Queue(services, { ...handlers, ...customHandlers }, entrypoint);
  };

  describe('base', () => {
    it('should be defined', () => {
      expect(Queue).toBeDefined();
    });

    it('should create queue', () => {
      const queue = createQueueFor('/foo/bar.js');
      expect(queue).toBeDefined();
      expect(queue.isEmpty()).toBe(false);
      Object.values(handlers).forEach((handler) => {
        expect(handler).not.toHaveBeenCalled();
      });
    });

    it('should run processEntrypoint', () => {
      const queue = createQueueFor('/foo/bar.js');
      queue.runNext();
      expect(handlers.processEntrypoint).toHaveBeenCalledTimes(1);
      expect(queue.isEmpty()).toBe(true);
    });

    it('should process next calls', async () => {
      const processEntrypoint: GetHandler<IProcessEntrypointAction> = (
        _services,
        action,
        next
      ) => {
        next('transform', action.entrypoint, {});
      };

      const queue = createQueueFor('/foo/bar.js', { processEntrypoint });
      await queue.runNext();
      expect(queue.isEmpty()).toBe(false);
      await queue.runNext();
      expect(queue.isEmpty()).toBe(true);
      expect(handlers.transform).toHaveBeenCalledTimes(1);
    });

    it('should call actions according to its weight', async () => {
      const processEntrypoint: GetHandler<IProcessEntrypointAction> = (
        _services,
        action,
        next
      ) => {
        next('transform', action.entrypoint, {});
        next('addToCodeCache', action.entrypoint, {
          data: {
            imports: null,
            result: {
              code: '',
              metadata: undefined,
            },
            only: [],
          },
        });
        next('explodeReexports', action.entrypoint, {});
        next('processImports', action.entrypoint, {
          resolved: [],
        });
        next('getExports', action.entrypoint, {});
        next('resolveImports', action.entrypoint, {
          imports: null,
        });
      };

      const queue = createQueueFor('/foo/bar.js', { processEntrypoint });
      await queue.runNext(); // processEntrypoint

      const rightOrder: (keyof UniversalHandlers)[] = [
        'resolveImports',
        'getExports',
        'processImports',
        'explodeReexports',
        'transform',
        'addToCodeCache',
      ];

      for (let i = 0; i < rightOrder.length; i++) {
        await queue.runNext();
        expect(handlers[rightOrder[i]]).toHaveBeenCalledTimes(1);
      }
    });
  });

  it('should work with events', async () => {
    const exports: string[] = ['resolved'];
    const onGetExports = jest.fn();

    const processEntrypoint: GetHandler<IProcessEntrypointAction> = (
      _services,
      action,
      next
    ) => {
      next('getExports', action.entrypoint, {}).on('resolve', onGetExports);
    };

    const getExports: GetHandler<IGetExportsAction> = (
      _services,
      _action,
      _next,
      callbacks
    ) => {
      callbacks.resolve(exports);
    };

    const queue = createQueueFor('/foo/bar.js', {
      processEntrypoint,
      getExports,
    });

    while (!queue.isEmpty()) {
      await queue.runNext();
    }

    expect(onGetExports).toHaveBeenCalledWith(exports);
  });

  it('should remove aborted actions', async () => {
    const abortController = new AbortController();
    const processEntrypoint: GetHandler<IProcessEntrypointAction> = (
      _services,
      action,
      next
    ) => {
      next('transform', action.entrypoint, {}, abortController.signal);
    };

    const queue = createQueueFor('/foo/bar.js', { processEntrypoint });
    await queue.runNext(); // processEntrypoint

    expect(handlers.transform).not.toHaveBeenCalled();

    abortController.abort();

    expect(queue.isEmpty()).toBe(true);
  });
});
