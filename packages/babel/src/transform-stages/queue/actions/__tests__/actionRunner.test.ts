/* eslint-disable require-yield */
import { EventEmitter } from '@linaria/utils';

import { TransformCacheCollection } from '../../../../cache';
import {
  createEntrypoint,
  fakeLoadAndParse,
} from '../../__tests__/entrypoint-helpers';
import type {
  Services,
  IProcessEntrypointAction,
  ActionQueueItem,
  Handler,
  ActionGenerator,
  AnyActionGenerator,
  Continuation,
  IResolveImportsAction,
  IResolvedImport,
} from '../../types';
import { createAction, isContinuation } from '../action';
import { actionRunner } from '../actionRunner';

type QueueItem = ActionQueueItem | Continuation;
type Queue = QueueItem[];

describe('actionRunner', () => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  function* emptyHandler(): ActionGenerator<ActionQueueItem> {}

  let services: Pick<Services, 'cache' | 'eventEmitter'>;
  beforeEach(() => {
    services = {
      cache: new TransformCacheCollection(),
      eventEmitter: EventEmitter.dummy,
    };

    fakeLoadAndParse.mockClear();
  });

  it('should be defined', () => {
    expect(actionRunner).toBeDefined();
  });

  it('should run action', () => {
    const action = createAction(
      'processEntrypoint',
      createEntrypoint(services, '/foo/bar.js', ['default']),
      {},
      null
    );

    const handler1 = jest.fn();
    const handler2 = jest.fn();
    function* handlerGenerator(): ActionGenerator<IProcessEntrypointAction> {
      handler1();
      yield ['resolveImports', action.entrypoint, { imports: new Map() }, null];
      handler2();
    }

    actionRunner(services, () => {}, action, '0001', handlerGenerator);
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).not.toHaveBeenCalled();
  });

  it('should not run action if its copy was already run', () => {
    const action1 = createAction(
      'processEntrypoint',
      createEntrypoint(services, '/foo/bar.js', ['default']),
      {},
      null
    );
    const action2 = createAction(
      'processEntrypoint',
      createEntrypoint(services, '/foo/bar.js', ['default']),
      {},
      null
    );

    const handler1 = jest.fn();
    const handler2 = jest.fn();
    function* handlerGenerator(): ActionGenerator<IProcessEntrypointAction> {
      handler1();
      yield [
        'resolveImports',
        action2.entrypoint,
        { imports: new Map() },
        null,
      ];
      handler2();
    }

    const task1 = actionRunner(
      services,
      () => {},
      action1,
      '0001',
      handlerGenerator
    );
    const task2 = actionRunner(
      services,
      () => {},
      action2,
      '0002',
      handlerGenerator
    );
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(task1).toBe(task2);
    expect(handler2).not.toHaveBeenCalled();
  });

  it('should call next for both copy', () => {
    const enqueue = jest.fn();
    const action1 = createAction(
      'processEntrypoint',
      createEntrypoint(services, '/foo/bar.js', ['default']),
      {},
      null
    );
    const action2 = createAction(
      'processEntrypoint',
      createEntrypoint(services, '/foo/bar.js', ['default']),
      {},
      null
    );

    function* handler(
      s: unknown,
      a: IProcessEntrypointAction
    ): ActionGenerator<IProcessEntrypointAction> {
      yield ['resolveImports', a.entrypoint, { imports: new Map() }, null];
    }

    actionRunner(services, enqueue, action1, '0001', handler);
    actionRunner(services, enqueue, action2, '0002', handler);

    expect(enqueue).toHaveBeenCalledTimes(4);

    // Both pair of actions should be called with the same arguments
    expect(enqueue.mock.calls[0][0]).toBe(enqueue.mock.calls[2][0]);
    expect(enqueue.mock.calls[1][0]).toBe(enqueue.mock.calls[3][0]);
  });

  it('should emit continuation of the action if its yielded another action', () => {
    const enqueue = jest.fn();
    const action1 = createAction(
      'processEntrypoint',
      createEntrypoint(services, '/foo/bar.js', ['default']),
      {},
      null
    );

    const resolveImportsData = { imports: new Map() };

    function* handler(
      s: unknown,
      a: IProcessEntrypointAction
    ): ActionGenerator<IProcessEntrypointAction> {
      yield ['resolveImports', a.entrypoint, resolveImportsData, null];
    }

    actionRunner(services, enqueue, action1, '0001', handler);
    expect(enqueue).toHaveBeenCalledTimes(2);
    expect(enqueue).nthCalledWith(1, {
      abortSignal: null,
      action: action1,
      generator: expect.anything(),
      uid: expect.anything(),
    });
    expect(enqueue).nthCalledWith(2, {
      abortSignal: null,
      entrypoint: action1.entrypoint,
      imports: resolveImportsData.imports,
      type: 'resolveImports',
    });
  });

  it('should return value from yielded action', () => {
    const action1 = createAction(
      'processEntrypoint',
      createEntrypoint(services, '/foo/bar.js', ['default']),
      {},
      null
    );

    const resolveImportsData = { imports: new Map() };

    const valueCatcher = jest.fn();
    const queue: Queue = [];
    const enqueue = (action: QueueItem) => {
      queue.push(action);
    };

    actionRunner(
      services,
      enqueue,
      action1,
      '0001',
      function* handler(s, a): ActionGenerator<IProcessEntrypointAction> {
        const result = yield [
          'resolveImports',
          a.entrypoint,
          resolveImportsData,
          null,
        ];
        valueCatcher(result);
      }
    );

    expect(queue).toHaveLength(2);
    expect(queue[1]).toMatchObject({
      imports: resolveImportsData.imports,
      type: 'resolveImports',
    });

    const resolvedImports: IResolvedImport[] = [
      {
        importedFile: './bar',
        importsOnly: ['default'],
        resolved: '/foo/bar.js',
      },
    ];
    actionRunner(
      services,
      enqueue,
      queue[1] as IResolveImportsAction,
      '0001',
      function* handler(): ActionGenerator<IResolveImportsAction> {
        return resolvedImports;
      }
    );

    actionRunner(services, enqueue, queue[0] as Continuation, '0001');

    expect(valueCatcher).toBeCalledTimes(1);
    expect(valueCatcher).toBeCalledWith(resolvedImports);
  });

  it('should call callback for emitted actions', () => {
    const queue1: Queue = [
      createAction(
        'processEntrypoint',
        createEntrypoint(services, '/foo/bar.js', ['default']),
        {},
        null
      ),
    ];
    const queue2: Queue = [
      createAction(
        'processEntrypoint',
        createEntrypoint(services, '/foo/bar.js', ['default']),
        {},
        null
      ),
    ];

    const enqueue = (queue: Queue, action: QueueItem) => {
      queue.push(action);
      return action;
    };

    const runNthFrom = (
      idx: number,
      queue: Queue,
      handler: Handler<
        Pick<Services, 'cache' | 'eventEmitter'>,
        ActionQueueItem,
        AnyActionGenerator
      > = emptyHandler
    ) => {
      const act = queue[idx];
      const emit = enqueue.bind(null, queue);
      if (isContinuation(act)) {
        return actionRunner(services, emit, act, `000${idx}`);
      }
      return actionRunner(
        services,
        emit,
        act,
        `000${idx}`,
        handler as Handler<
          Pick<Services, 'cache' | 'eventEmitter'>,
          ActionQueueItem,
          AnyActionGenerator
        >
      );
    };

    // Both queues should have one action
    expect(queue1).toHaveLength(1);
    expect(queue2).toHaveLength(1);

    runNthFrom(
      0,
      queue1,
      function* handler(s, a): ActionGenerator<ActionQueueItem> {
        yield ['transform', a.entrypoint, { imports: new Map() }, null];
        yield ['resolveImports', a.entrypoint, { imports: new Map() }, null];
      }
    );

    // The first action from queue1 has been run and emitted a new action
    expect(queue1).toHaveLength(3);
    // The second queue shouldn't be affected
    expect(queue2).toHaveLength(1);

    // Simulate a traffic jam in queue1 and start running actions from queue2
    runNthFrom(0, queue2);
    runNthFrom(1, queue2);
    runNthFrom(2, queue2);
    runNthFrom(3, queue2);
    runNthFrom(4, queue2);

    // First queue still has 3 actions because it wasn't touched
    expect(queue1).toHaveLength(3);

    // Second queue is full
    expect(queue2).toHaveLength(5);

    const shouldNotBeCalled = jest.fn();
    function* handlerWithMock() {
      shouldNotBeCalled();
    }
    // Run the rests action from queue1
    runNthFrom(1, queue1, handlerWithMock);
    runNthFrom(2, queue2, handlerWithMock);
    runNthFrom(3, queue2, handlerWithMock);
    runNthFrom(4, queue2, handlerWithMock);
    expect(queue1).toHaveLength(5);

    // The second queue should not be affected
    expect(queue2).toHaveLength(5);

    // The handler should not be called
    expect(shouldNotBeCalled).not.toHaveBeenCalled();
  });
});
