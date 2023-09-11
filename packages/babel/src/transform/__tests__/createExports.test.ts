import { linariaLogger } from '@linaria/logger';

import { createExports } from '../BaseEntrypoint';

describe('createExports', () => {
  it('should be defined', () => {
    expect(createExports).toBeDefined();
  });

  it('should create exports object', () => {
    const exports = createExports(linariaLogger);
    expect(exports).toBeDefined();
  });

  it('should set and get value', () => {
    const exports = createExports(linariaLogger);
    exports.foo = 'bar';
    expect(exports.foo).toBe('bar');
  });

  it('should set and get value with defineProperty', () => {
    const exports = createExports(linariaLogger);
    Object.defineProperty(exports, 'foo', {
      value: 'bar',
    });
    expect(exports.foo).toBe('bar');
  });

  it('should set and get value with defineProperty and getter', () => {
    const exports = createExports(linariaLogger);
    Object.defineProperty(exports, 'foo', {
      get: () => 'bar',
    });
    expect(exports.foo).toBe('bar');
  });

  it('should not override value with undefined', () => {
    const exports = createExports(linariaLogger);
    exports.foo = 'bar';
    exports.foo = undefined;
    expect(exports.foo).toBe('bar');
  });

  it('should not override value with defineProperty and undefined', () => {
    const exports = createExports(linariaLogger);
    exports.foo = 'bar';
    Object.defineProperty(exports, 'foo', {
      value: undefined,
    });
    expect(exports.foo).toBe('bar');
  });

  it('should not override value with defineProperty and getter returning undefined', () => {
    const exports = createExports(linariaLogger);
    exports.foo = 'bar';
    Object.defineProperty(exports, 'foo', {
      get: () => undefined,
    });

    expect(exports.foo).toBe('bar');
  });

  it('should not override lazy value with defineProperty and getter returning undefined', () => {
    const exports = createExports(linariaLogger);
    Object.defineProperty(exports, 'foo', {
      get: () => 'bar',
    });

    Object.defineProperty(exports, 'foo', {
      get: () => undefined,
    });

    expect(exports.foo).toBe('bar');
  });
});
