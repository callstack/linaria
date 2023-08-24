/* eslint-disable require-yield */
import {
  createSyncEntrypoint,
  createServices,
  createAsyncEntrypoint,
} from '../../__tests__/entrypoint-helpers';
import type {
  Services,
  IProcessEntrypointAction,
  ActionQueueItem,
  SyncScenarioForAction,
  Handlers,
  IResolveImportsAction,
} from '../../types';
import { asyncActionRunner, syncActionRunner } from '../actionRunner';
import type { IResolvedImport } from '../types';

type SyncHandlers<TMode extends 'async' | 'sync'> = Handlers<TMode>;

describe('actionRunner', () => {
  function* emptyHandler<
    TAction extends ActionQueueItem<'sync'>,
  >(): SyncScenarioForAction<TAction> {
    return undefined as any;
  }

  const getHandlers = <TMode extends 'async' | 'sync'>(
    partial: Partial<SyncHandlers<TMode>>
  ) => ({
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
    ...partial,
  });
  let services: Services;

  beforeEach(() => {
    services = createServices();
  });

  it('should be defined', () => {
    expect(asyncActionRunner).toBeDefined();
    expect(syncActionRunner).toBeDefined();
  });

  it('should run action', () => {
    const handlers = getHandlers<'sync'>({});

    const entrypoint = createSyncEntrypoint(services, handlers, '/foo/bar.js', [
      'default',
    ]);
    const action = entrypoint.createAction(
      'processEntrypoint',
      undefined,
      null
    );

    syncActionRunner(action);
    expect(handlers.processEntrypoint).toHaveBeenCalled();
  });

  it('should not run action if its copy was already run', async () => {
    const handler = jest.fn();
    function* handlerGenerator(
      this: IProcessEntrypointAction<'sync'>
    ): SyncScenarioForAction<IProcessEntrypointAction<'sync'>> {
      handler();
      yield ['resolveImports', this.entrypoint, { imports: new Map() }, null];
    }

    const handlers = getHandlers({
      processEntrypoint: handlerGenerator,
    });

    const entrypoint1 = createAsyncEntrypoint(
      services,
      handlers,
      '/foo/bar.js',
      ['default']
    );
    const entrypoint2 = createAsyncEntrypoint(
      services,
      handlers,
      '/foo/bar.js',
      ['default']
    );

    expect(entrypoint1).toBe(entrypoint2);

    const action1 = entrypoint1.createAction(
      'processEntrypoint',
      undefined,
      null
    );
    const action2 = entrypoint2.createAction(
      'processEntrypoint',
      undefined,
      null
    );

    expect(action1).toBe(action2);

    const task1 = asyncActionRunner(action1);
    const task2 = asyncActionRunner(action2);
    await Promise.all([task1, task2]);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handlers.resolveImports).toHaveBeenCalledTimes(1);
  });

  it('should return value from yielded action', async () => {
    const resolveImportsData = { imports: new Map() };

    const valueCatcher = jest.fn();
    function* processEntrypoint(
      this: IProcessEntrypointAction<'sync'>
    ): SyncScenarioForAction<IProcessEntrypointAction<'sync'>> {
      const result = yield [
        'resolveImports',
        this.entrypoint,
        resolveImportsData,
        null,
      ];

      valueCatcher(result);
    }

    const resolvedImports: IResolvedImport[] = [
      {
        importedFile: './bar',
        importsOnly: ['default'],
        resolved: '/foo/bar.js',
      },
    ];

    function* resolveImports(): SyncScenarioForAction<
      IResolveImportsAction<'sync'>
    > {
      return resolvedImports;
    }

    const handlers = getHandlers({
      processEntrypoint,
      resolveImports,
    });

    const entrypoint = createAsyncEntrypoint(
      services,
      handlers,
      '/foo/bar.js',
      ['default']
    );

    const action = entrypoint.createAction(
      'processEntrypoint',
      undefined,
      null
    );

    await asyncActionRunner(action);

    expect(valueCatcher).toBeCalledTimes(1);
    expect(valueCatcher).toBeCalledWith(resolvedImports);
  });
});
