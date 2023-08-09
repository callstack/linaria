/* eslint-disable no-await-in-loop */
import { EventEmitter, getFileIdx } from '@linaria/utils';

import { AsyncActionQueue } from '../../src/transform-stages/queue/ActionQueue';
import type {
  IBaseServices,
  Handlers,
} from '../../src/transform-stages/queue/GenericActionQueue';
import { rootLog } from '../../src/transform-stages/queue/rootLog';
import type {
  IBaseEntrypoint,
  IProcessEntrypointAction,
} from '../../src/transform-stages/queue/types';

const createEntrypoint = (name: string): IBaseEntrypoint => ({
  name,
  idx: getFileIdx(name).toString().padStart(5, '0'),
  only: ['default'],
  log: rootLog,
  parent: null,
});

type AsyncHandlers = Handlers<Promise<void> | void, IBaseServices>;

describe('AsyncActionQueue', () => {
  let services: IBaseServices;
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
      eventEmitter: EventEmitter.dummy,
    };
  });

  const createQueueFor = (
    name: string,
    customHandlers: Partial<AsyncHandlers> = {}
  ) => {
    const entrypoint = createEntrypoint(name);
    return new AsyncActionQueue(
      services,
      { ...handlers, ...customHandlers },
      entrypoint
    );
  };

  it('should call actions according to its weight', async () => {
    const processEntrypoint = jest.fn(
      (_services: IBaseServices, action: IProcessEntrypointAction) => {
        action.next('transform', action.entrypoint, {});
        action.next('addToCodeCache', action.entrypoint, {
          data: {
            imports: null,
            result: {
              code: '',
              metadata: undefined,
            },
            only: [],
          },
        });
        action.next('explodeReexports', action.entrypoint, {});
        action.next('processImports', action.entrypoint, {
          resolved: [],
        });
        action.next('getExports', action.entrypoint, {});
        action.next('resolveImports', action.entrypoint, {
          imports: null,
        });
      }
    );

    const queue = createQueueFor('/foo/bar.js', { processEntrypoint });
    await queue.runNext(); // processEntrypoint

    const rightOrder: (keyof AsyncHandlers)[] = [
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
