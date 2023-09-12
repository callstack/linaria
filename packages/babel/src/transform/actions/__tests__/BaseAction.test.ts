/* eslint-disable require-yield */
import type { Entrypoint } from '../../Entrypoint';
import {
  createEntrypoint,
  createServices,
} from '../../__tests__/entrypoint-helpers';
import type { ITransformAction, Services, Handler } from '../../types';
import { BaseAction } from '../BaseAction';

describe('BaseAction', () => {
  const emptyResult = { code: '', metadata: null };

  let services: Services;
  let entrypoint: Entrypoint;

  beforeEach(() => {
    services = createServices();
    entrypoint = createEntrypoint(services, '/foo/bar.js', ['default']);
  });

  it('should be defined', () => {
    expect(BaseAction).toBeDefined();
  });

  describe('instance', () => {
    let action: BaseAction<ITransformAction>;
    let onError: jest.Mock;

    beforeEach(() => {
      action = new BaseAction(
        'transform',
        services,
        entrypoint,
        undefined,
        null
      );

      onError = jest.fn();
    });

    it('action can be run', () => {
      expect(action.run).toBeDefined();
    });

    it('run should return generator-like object', () => {
      const generator = action.run(function* dummy() {
        return emptyResult;
      });
      expect(generator.next).toBeDefined();
      expect(generator.throw).toBeDefined();
    });

    it('generator should yield data', () => {
      const generator = action.run<'sync', Handler<'sync', ITransformAction>>(
        function* dummy() {
          yield ['resolveImports', entrypoint, { imports: new Map() }, null];

          return { code: 'bar', metadata: null };
        }
      );

      expect(generator.next()).toEqual({
        done: false,
        value: ['resolveImports', entrypoint, { imports: new Map() }, null],
      });

      expect(generator.next()).toEqual({
        done: true,
        value: { code: 'bar', metadata: null },
      });
    });

    it('should return previous result if run again', () => {
      const handler: Handler<'sync', ITransformAction> = function* handler() {
        yield ['resolveImports', entrypoint, { imports: new Map() }, null];

        return { code: 'bar', metadata: null };
      };

      const generator1 = action.run(handler);
      const generator2 = action.run(handler);

      expect(generator1.next()).toBe(generator2.next()); // yield
      expect(generator1.next()).toBe(generator2.next()); // return
    });

    it('should process error in generator', () => {
      const handler: Handler<'sync', ITransformAction> = function* handler() {
        try {
          yield ['resolveImports', entrypoint, { imports: new Map() }, null];
        } catch (e) {
          onError(e);
        }

        return emptyResult;
      };

      const generator = action.run(handler);

      expect(generator.next()).toEqual({
        done: false,
        value: ['resolveImports', entrypoint, { imports: new Map() }, null],
      });

      const error = new Error('foo');
      expect(generator.throw(error)).toEqual({
        done: true,
        value: emptyResult,
      });
      expect(onError).toHaveBeenCalledWith(error);
    });

    it('should yield correct data after error', () => {
      const handler: Handler<'sync', ITransformAction> = function* handler() {
        try {
          yield ['resolveImports', entrypoint, { imports: new Map() }, null];
        } catch (e) {
          onError(e);
        }

        yield ['processImports', entrypoint, { resolved: [] }, null];

        return emptyResult;
      };

      const generator = action.run(handler);

      expect(generator.next()).toEqual({
        done: false,
        value: ['resolveImports', entrypoint, { imports: new Map() }, null],
      });

      const error = new Error('foo');
      expect(generator.throw(error)).toEqual({
        done: false,
        value: ['processImports', entrypoint, { resolved: [] }, null],
      });
      expect(onError).toHaveBeenCalledWith(error);

      expect(generator.next()).toEqual({
        done: true,
        value: emptyResult,
      });
    });

    it('should return the same data for repetitive runs if the first one had error', () => {
      const handler: Handler<'sync', ITransformAction> = function* handler() {
        try {
          yield ['resolveImports', entrypoint, { imports: new Map() }, null];
        } catch (e) {
          onError(e);
        }

        return emptyResult;
      };

      const generator1 = action.run(handler);
      const generator2 = action.run(handler);

      expect(generator1.next()).toEqual({
        done: false,
        value: ['resolveImports', entrypoint, { imports: new Map() }, null],
      });

      const error = new Error('foo');
      expect(generator1.throw(error)).toEqual({
        done: true,
        value: emptyResult,
      });
      expect(onError).toHaveBeenCalledWith(error);

      expect(generator2.next()).toEqual({
        done: false,
        value: ['resolveImports', entrypoint, { imports: new Map() }, null],
      });

      expect(generator2.next()).toEqual({ done: true, value: emptyResult });
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it("should rethrow error from every run if the first one didn't catch it", () => {
      const error = new Error('foo');

      const handler: Handler<'sync', ITransformAction> = function* handler() {
        throw error;
      };

      const generator1 = action.run(handler);
      const generator2 = action.run(handler);

      expect(() => generator1.next()).toThrow(error);
      expect(() => generator2.next()).toThrow(error);
    });

    it('should process parallel throws', () => {
      const handler: Handler<'sync', ITransformAction> = function* handler() {
        try {
          yield ['resolveImports', entrypoint, { imports: new Map() }, null];
        } catch (e) {
          onError(e);
        }

        return emptyResult;
      };

      const generator1 = action.run(handler);
      const generator2 = action.run(handler);

      expect(generator1.next()).toEqual({
        done: false,
        value: ['resolveImports', entrypoint, { imports: new Map() }, null],
      });
      expect(generator2.next()).toEqual({
        done: false,
        value: ['resolveImports', entrypoint, { imports: new Map() }, null],
      });

      const error1 = new Error('foo');
      const error2 = new Error('bar');
      expect(generator1.throw(error1)).toEqual({
        done: true,
        value: emptyResult,
      });
      expect(generator2.throw(error2)).toEqual({
        done: true,
        value: emptyResult,
      });
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(error1);
    });

    it('should cache results of async generators', async () => {
      const wait = () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(null);
          }, 100);
        });

      const handler: Handler<'async', ITransformAction> =
        async function* handler() {
          await wait();
          yield ['resolveImports', entrypoint, { imports: new Map() }, null];

          return { code: 'bar', metadata: null };
        };

      const generator1 = action.run(handler);
      const generator2 = action.run(handler);

      const gen1Next = await generator1.next();
      expect(gen1Next).toEqual({
        done: false,
        value: ['resolveImports', entrypoint, { imports: new Map() }, null],
      });

      expect(await generator2.next()).toEqual(gen1Next);

      const gen1Result = await generator1.next();
      expect(gen1Result).toEqual({
        done: true,
        value: { code: 'bar', metadata: null },
      });

      expect(await generator2.next()).toEqual(gen1Result);
    });

    it('should cache errors of async generators', async () => {
      const wait = () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(null);
          }, 100);
        });

      const handler: Handler<'async', ITransformAction> =
        async function* handler() {
          await wait();
          yield ['resolveImports', entrypoint, { imports: new Map() }, null];

          throw new Error('foo');
        };

      const generator1 = action.run(handler);
      const generator2 = action.run(handler);

      const gen1Next = await generator1.next();
      expect(gen1Next).toEqual({
        done: false,
        value: ['resolveImports', entrypoint, { imports: new Map() }, null],
      });

      expect(await generator2.next()).toEqual(gen1Next);

      let error: unknown;
      try {
        await generator1.next();
        fail('should throw');
      } catch (e) {
        error = e;
        expect(e).toBe(error);
      }

      try {
        await generator2.next();
        fail('should throw');
      } catch (e) {
        expect(e).toBe(error);
      }
    });
  });
});
