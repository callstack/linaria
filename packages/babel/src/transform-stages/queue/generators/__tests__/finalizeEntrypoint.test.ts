import {
  createEntrypoint,
  createServices,
} from '../../__tests__/entrypoint-helpers';
import type { Services } from '../../types';
import { finalizeEntrypoint } from '../finalizeEntrypoint';

import { expectIteratorReturnResult } from './helpers';

describe('finalizeEntrypoint', () => {
  let services: Services;
  beforeEach(() => {
    services = createServices();
  });

  it('should call finalizer', () => {
    const fooBarDefault = createEntrypoint(services, '/foo/bar.js', [
      'default',
    ]);

    const finalizer = jest.fn();
    const action = fooBarDefault.createAction(
      'finalizeEntrypoint',
      {
        finalizer,
      },
      null
    );

    const gen = finalizeEntrypoint.call(action);
    expectIteratorReturnResult(gen.next(), undefined);
    expect(finalizer).toHaveBeenCalled();
  });

  xit('should re-emit processEntrypoint if entrypoint was superseded', () => {
    const fooBarDefault = createEntrypoint(services, '/foo/bar.js', [
      'default',
    ]);

    const finalizer = jest.fn();
    const action = fooBarDefault.createAction(
      'finalizeEntrypoint',
      {
        finalizer,
      },
      null
    );
    const gen = finalizeEntrypoint.call(action);

    const fooBarNamed = createEntrypoint(services, '/foo/bar.js', ['named']);

    const result = gen.next();
    expect(result.value).toEqual(['processEntrypoint', fooBarNamed, {}, null]);

    expectIteratorReturnResult(gen.next(), undefined);
  });
});
