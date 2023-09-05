/* eslint-disable require-yield */
import type { IEntrypointDependency } from '../../Entrypoint.types';
import {
  createEntrypoint,
  createServices,
  getHandlers,
} from '../../__tests__/entrypoint-helpers';
import { processEntrypoint } from '../../generators/processEntrypoint';
import type {
  Services,
  IProcessEntrypointAction,
  SyncScenarioForAction,
  IResolveImportsAction,
  IWorkflowAction,
  YieldArg,
  IExplodeReexportsAction,
} from '../../types';
import type { BaseAction } from '../BaseAction';
import { asyncActionRunner, syncActionRunner } from '../actionRunner';

describe('actionRunner', () => {
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

    const entrypoint = createEntrypoint(services, '/foo/bar.js', ['default']);
    const action = entrypoint.createAction(
      'processEntrypoint',
      undefined,
      null
    );

    syncActionRunner(action, handlers);
    expect(handlers.processEntrypoint).toHaveBeenCalled();
  });

  it('should not run action if its copy was already run', async () => {
    const handler = jest.fn();
    function* handlerGenerator(
      this: IProcessEntrypointAction
    ): SyncScenarioForAction<IProcessEntrypointAction> {
      handler();
      yield ['resolveImports', this.entrypoint, { imports: new Map() }, null];
    }

    const handlers = getHandlers({
      processEntrypoint: handlerGenerator,
    });

    const entrypoint1 = createEntrypoint(services, '/foo/bar.js', ['default']);
    const entrypoint2 = createEntrypoint(services, '/foo/bar.js', ['default']);

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

    const task1 = asyncActionRunner(action1, handlers);
    const task2 = asyncActionRunner(action2, handlers);
    await Promise.all([task1, task2]);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handlers.resolveImports).toHaveBeenCalledTimes(1);
  });

  it('should return value from yielded action', async () => {
    const resolveImportsData = { imports: new Map() };

    const valueCatcher = jest.fn();
    const resolvedImports: IEntrypointDependency[] = [
      {
        source: './bar',
        only: ['default'],
        resolved: '/foo/bar.js',
      },
    ];

    function* resolveImports(): SyncScenarioForAction<IResolveImportsAction> {
      return resolvedImports;
    }

    const handlers = getHandlers({
      *processEntrypoint(
        this: IProcessEntrypointAction
      ): SyncScenarioForAction<IProcessEntrypointAction> {
        const result = yield [
          'resolveImports',
          this.entrypoint,
          resolveImportsData,
          null,
        ];

        valueCatcher(result);
      },
      resolveImports,
    });

    const entrypoint = createEntrypoint(services, '/foo/bar.js', ['default']);

    const action = entrypoint.createAction(
      'processEntrypoint',
      undefined,
      null
    );

    await asyncActionRunner(action, handlers);

    expect(valueCatcher).toBeCalledTimes(1);
    expect(valueCatcher).toBeCalledWith(resolvedImports);
  });

  it('should throw if action was aborted', () => {
    const abortController = new AbortController();
    abortController.abort();

    function* handlerGenerator(
      this: IWorkflowAction
    ): SyncScenarioForAction<IWorkflowAction> {
      yield [
        'processEntrypoint',
        this.entrypoint,
        undefined,
        abortController.signal,
      ];

      throw new Error('Should not be reached');
    }

    const handlers = getHandlers<'sync'>({
      workflow: handlerGenerator,
    });

    const entrypoint = createEntrypoint(services, '/foo/bar.js', ['default']);
    const action = entrypoint.createAction('workflow', undefined, null);

    expect(() => syncActionRunner(action, handlers)).toThrowError(
      'workflow@00001#1'
    );
  });

  it('should call recover', () => {
    const abortController = new AbortController();
    abortController.abort();

    function* handlerGenerator(
      this: IWorkflowAction
    ): SyncScenarioForAction<IWorkflowAction> {
      yield [
        'processEntrypoint',
        this.entrypoint,
        undefined,
        abortController.signal,
      ];

      throw new Error('Should not be reached');
    }

    handlerGenerator.recover = jest.fn<
      YieldArg,
      [e: unknown, action: BaseAction<IWorkflowAction>]
    >((e): YieldArg => {
      throw e;
    });

    const handlers = getHandlers<'sync'>({
      workflow: handlerGenerator,
    });

    const entrypoint = createEntrypoint(services, '/foo/bar.js', ['default']);
    const action = entrypoint.createAction('workflow', undefined, null);

    expect(() => syncActionRunner(action, handlers)).toThrowError(
      'workflow@00001#1'
    );

    expect(handlerGenerator.recover).toHaveBeenCalled();
  });

  it('should recover', () => {
    const abortController = new AbortController();
    abortController.abort();

    function* handlerGenerator(
      this: IWorkflowAction
    ): SyncScenarioForAction<IWorkflowAction> {
      yield [
        'processEntrypoint',
        this.entrypoint,
        undefined,
        abortController.signal,
      ];

      throw new Error('Should not be reached');
    }

    handlerGenerator.recover = jest.fn<
      YieldArg,
      [e: unknown, action: BaseAction<IWorkflowAction>]
    >((e, action): YieldArg => {
      return ['processEntrypoint', action.entrypoint, undefined, null];
    });

    const handlers = getHandlers<'sync'>({
      workflow: handlerGenerator,
    });

    const entrypoint = createEntrypoint(services, '/foo/bar.js', ['default']);
    const action = entrypoint.createAction('workflow', undefined, null);

    syncActionRunner(action, handlers);
    expect(handlerGenerator.recover).toHaveBeenCalled();
  });

  it('should process triple superseded entrypoint', () => {
    const fooBarDefault = createEntrypoint(services, '/foo/bar.js', [
      'default',
    ]);

    const handlers = getHandlers<'sync'>({
      explodeReexports: function* explodeReexports(
        this: IExplodeReexportsAction
      ): SyncScenarioForAction<IExplodeReexportsAction> {
        createEntrypoint(services, '/foo/bar.js', ['named']);
        createEntrypoint(services, '/foo/bar.js', ['default', 'bar']);

        yield ['getExports', this.entrypoint, undefined, null];
      },
      processEntrypoint,
    });

    const action = fooBarDefault.createAction(
      'processEntrypoint',
      undefined,
      null
    );

    syncActionRunner(action, handlers);
  });
});
