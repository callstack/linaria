import type { File } from '@babel/types';

import type { LoadAndParseFn } from '../../src/transform-stages/queue/createEntrypoint';
import { genericCreateEntrypoint } from '../../src/transform-stages/queue/createEntrypoint';
import { rootLog } from '../../src/transform-stages/queue/rootLog';
import type {
  IEntrypoint,
  Services,
} from '../../src/transform-stages/queue/types';

export const fakeLoadAndParse = jest.fn<
  ReturnType<LoadAndParseFn<unknown, unknown>>,
  []
>(() => ({
  ast: {} as File,
  code: '',
  evaluator: jest.fn(),
  evalConfig: {},
}));

export const createEntrypoint = (
  services: Pick<Services, 'cache' | 'eventEmitter'>,
  name: string,
  only: string[],
  parent: IEntrypoint<unknown> | null = null
) => {
  const entrypoint = genericCreateEntrypoint(
    fakeLoadAndParse,
    services,
    parent ?? { log: rootLog },
    name,
    only,
    undefined,
    null
  );

  if (entrypoint === 'ignored') {
    throw new Error('entrypoint was ignored');
  }

  return entrypoint;
};
