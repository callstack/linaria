/* eslint-disable require-yield */
import type { Entrypoint } from '../../Entrypoint';
import {
  createEntrypoint,
  createServices,
} from '../../__tests__/entrypoint-helpers';
import type { ITransformAction, Services, Handler } from '../../types';
import { BaseAction } from '../BaseAction';

describe('BaseAction', () => {
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
        return null;
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

        return null;
      };

      const generator = action.run(handler);

      expect(generator.next()).toEqual({
        done: false,
        value: ['resolveImports', entrypoint, { imports: new Map() }, null],
      });

      const error = new Error('foo');
      expect(generator.throw(error)).toEqual({ done: true, value: null });
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

        return null;
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
        value: null,
      });
    });

    it('should return the same data for repetitive runs if the first one had error', () => {
      const handler: Handler<'sync', ITransformAction> = function* handler() {
        try {
          yield ['resolveImports', entrypoint, { imports: new Map() }, null];
        } catch (e) {
          onError(e);
        }

        return null;
      };

      const generator1 = action.run(handler);
      const generator2 = action.run(handler);

      expect(generator1.next()).toEqual({
        done: false,
        value: ['resolveImports', entrypoint, { imports: new Map() }, null],
      });

      const error = new Error('foo');
      expect(generator1.throw(error)).toEqual({ done: true, value: null });
      expect(onError).toHaveBeenCalledWith(error);

      expect(generator2.next()).toEqual({
        done: false,
        value: ['resolveImports', entrypoint, { imports: new Map() }, null],
      });

      expect(generator2.next()).toEqual({ done: true, value: null });
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
  });
});
