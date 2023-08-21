/* eslint-disable no-await-in-loop,require-yield */
import { EventEmitter } from '@linaria/utils';

import { TransformCacheCollection } from '../../../cache';
import { AsyncActionQueue, SyncActionQueue } from '../ActionQueue';
import type { Handlers } from '../GenericActionQueue';
import type {
  IGetExportsAction,
  IProcessEntrypointAction,
  ActionGenerator,
  ActionQueueItem,
  Services,
} from '../types';

import { createEntrypoint } from './entrypoint-helpers';

type BaseServices = Pick<Services, 'cache' | 'eventEmitter'>;
type Res = ActionGenerator<ActionQueueItem>;
type UniversalHandlers = Handlers<Res, BaseServices>;
type Queues = typeof AsyncActionQueue | typeof SyncActionQueue;

describe.each<[string, Queues]>([
  ['AsyncActionQueue', AsyncActionQueue],
  ['SyncActionQueue', SyncActionQueue],
])('%s', (_name, Queue) => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  function* emptyHandler(): ActionGenerator<ActionQueueItem> {}

  function drainQueue(
    queue: AsyncActionQueue<BaseServices> | SyncActionQueue<BaseServices>
  ) {
    while (!queue.isEmpty()) {
      queue.runNext();
    }
  }

  let services: BaseServices;
  let handlers: UniversalHandlers;
  beforeEach(() => {
    handlers = {
      addToCodeCache: jest.fn(emptyHandler),
      collect: jest.fn(emptyHandler),
      evalFile: jest.fn(emptyHandler),
      explodeReexports: jest.fn(emptyHandler),
      extract: jest.fn(emptyHandler),
      finalizeEntrypoint: jest.fn(emptyHandler),
      getExports: jest.fn(emptyHandler),
      processEntrypoint: jest.fn(emptyHandler),
      processImports: jest.fn(emptyHandler),
      resolveImports: jest.fn(emptyHandler),
      transform: jest.fn(emptyHandler),
      workflow: jest.fn(emptyHandler),
    };

    services = {
      eventEmitter: EventEmitter.dummy,
      cache: new TransformCacheCollection(),
    };
  });

  const createQueueFor = (
    name: string,
    customHandlers: Partial<UniversalHandlers> = {}
  ) => {
    const entrypoint = createEntrypoint(services, name, ['default']);
    const queue = new Queue(
      services,
      { ...handlers, ...customHandlers },
      entrypoint
    );

    queue.next('processEntrypoint', entrypoint, {});

    return queue;
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
      function* processEntrypoint(
        _services: unknown,
        action: IProcessEntrypointAction
      ): ActionGenerator<IProcessEntrypointAction> {
        yield ['transform', action.entrypoint, {}];
      }

      const queue = createQueueFor('/foo/bar.js', { processEntrypoint });
      await queue.runNext();
      expect(queue.isEmpty()).toBe(false);
      await drainQueue(queue);
      expect(queue.isEmpty()).toBe(true);
      expect(handlers.transform).toHaveBeenCalledTimes(1);
    });

    it('should call actions according to its weight', async () => {
      function* processEntrypoint(
        _services: unknown,
        action: IProcessEntrypointAction
      ): ActionGenerator<IProcessEntrypointAction> {
        yield ['transform', action.entrypoint, {}];
        yield [
          'addToCodeCache',
          action.entrypoint,
          {
            data: {
              imports: null,
              result: {
                code: '',
                metadata: undefined,
              },
              only: [],
            },
          },
        ];
        yield ['explodeReexports', action.entrypoint, {}];
        yield ['processImports', action.entrypoint, { resolved: [] }];
        yield ['getExports', action.entrypoint, {}];
        yield ['resolveImports', action.entrypoint, { imports: null }];
      }

      const queue = createQueueFor('/foo/bar.js', { processEntrypoint });

      await drainQueue(queue);

      const rightOrder: (keyof UniversalHandlers)[] = [
        'resolveImports',
        'getExports',
        'processImports',
        'explodeReexports',
        'transform',
        'addToCodeCache',
      ];

      for (let i = 0; i < rightOrder.length; i++) {
        expect(handlers[rightOrder[i]]).toHaveBeenCalledTimes(1);
      }
    });
  });

  it('should return values', async () => {
    const exports: string[] = ['resolved'];
    const onGetExports = jest.fn();

    function* processEntrypoint(
      _services: unknown,
      action: IProcessEntrypointAction
    ): ActionGenerator<IProcessEntrypointAction> {
      onGetExports(yield ['getExports', action.entrypoint, {}, null, true]);
    }

    function* getExports(): ActionGenerator<IGetExportsAction> {
      return exports;
    }

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
    function* processEntrypoint(
      _services: unknown,
      action: IProcessEntrypointAction
    ): ActionGenerator<IProcessEntrypointAction> {
      yield ['transform', action.entrypoint, {}, abortController.signal];
    }

    const queue = createQueueFor('/foo/bar.js', { processEntrypoint });
    await queue.runNext(); // processEntrypoint …
    await queue.runNext(); // … and its continuation

    expect(queue.isEmpty()).toBe(false);
    expect(handlers.transform).not.toHaveBeenCalled();

    abortController.abort();

    expect(queue.isEmpty()).toBe(true);
  });
});
