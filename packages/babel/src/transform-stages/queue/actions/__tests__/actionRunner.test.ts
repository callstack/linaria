import { EventEmitter } from '@linaria/utils';

import { TransformCacheCollection } from '../../../../cache';
import {
  createEntrypoint,
  fakeLoadAndParse,
} from '../../__tests__/entrypoint-helpers';
import type {
  Next,
  Services,
  IProcessEntrypointAction,
  ActionQueueItem,
  Handler,
} from '../../types';
import { createAction } from '../action';
import { actionRunner } from '../actionRunner';

describe('actionRunner', () => {
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

    const handler = jest.fn();

    actionRunner(services, () => {}, handler, action, '0001');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should run action with callbacks', () => {
    const onDone = jest.fn();
    const action = createAction(
      'transform',
      createEntrypoint(services, '/foo/bar.js', ['default']),
      {},
      null
    );

    action.on('done', onDone);

    actionRunner(
      services,
      () => {},
      (s, a, n, callbacks) => {
        callbacks.done();
      },
      action,
      '0001'
    );

    expect(onDone).toHaveBeenCalledTimes(1);
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

    const handler = jest.fn();

    const task1 = actionRunner(services, () => {}, handler, action1, '0001');
    const task2 = actionRunner(services, () => {}, handler, action2, '0002');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(task1).toBe(task2);
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

    const handler = (s: unknown, a: IProcessEntrypointAction, n: Next) => {
      n('resolveImports', a.entrypoint, { imports: new Map() }, null);
    };

    actionRunner(services, enqueue, handler, action1, '0001');
    actionRunner(services, enqueue, handler, action2, '0002');

    expect(enqueue).toHaveBeenCalledTimes(2);
    // Both actions should be called with the same arguments
    expect(enqueue).lastCalledWith(...enqueue.mock.calls[0]);
  });

  it('should call callback for emitted actions', () => {
    const queue1: ActionQueueItem[] = [
      createAction(
        'processEntrypoint',
        createEntrypoint(services, '/foo/bar.js', ['default']),
        {},
        null
      ),
    ];
    const queue2: ActionQueueItem[] = [
      createAction(
        'processEntrypoint',
        createEntrypoint(services, '/foo/bar.js', ['default']),
        {},
        null
      ),
    ];

    const enqueue = (queue: ActionQueueItem[], action: ActionQueueItem) => {
      queue.push(action);
      return action;
    };

    const runNthFrom = (
      idx: number,
      queue: ActionQueueItem[],
      handler: (
        s: unknown,
        a: ActionQueueItem,
        n: Next,
        callbacks: Record<string, () => void>
      ) => void = () => {}
    ) =>
      actionRunner(
        services,
        enqueue.bind(null, queue),
        handler as Handler<
          Pick<Services, 'cache' | 'eventEmitter'>,
          ActionQueueItem,
          Promise<void> | void
        >,
        queue[idx],
        `000${queue}`
      );

    // Both queues should have one action
    expect(queue1).toHaveLength(1);
    expect(queue2).toHaveLength(1);

    runNthFrom(0, queue1, (s, a, n) => {
      n('transform', a.entrypoint, { imports: new Map() }, null).on(
        'done',
        () => {
          n('resolveImports', a.entrypoint, { imports: new Map() }, null);
        }
      );
    });

    // The first action from queue1 has been run and emitted a new action
    expect(queue1).toHaveLength(2);
    // The second queue shouldn't be affected
    expect(queue2).toHaveLength(1);

    // Simulate a traffic jam in queue1 and start running actions from queue2
    runNthFrom(0, queue2);
    runNthFrom(1, queue2, (s, a, n, callbacks) => {
      callbacks.done();
    });

    // Both queues should have three actions
    expect(queue1).toHaveLength(3);
    expect(queue2).toHaveLength(3);
  });
});
