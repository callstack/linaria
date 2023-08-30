import type { Debugger } from '@linaria/logger';

import { BaseEntrypoint } from './BaseEntrypoint';
import type { StackOfMaps } from './helpers/StackOfMaps';

export interface IEvaluatedEntrypoint {
  evaluated: true;
  evaluatedOnly: string[];
  exports: unknown;
  exportsValues: StackOfMaps<string | symbol, unknown>;
  generation: number;
  ignored: false;
  log: Debugger;
  only: string[];
}

export class EvaluatedEntrypoint
  extends BaseEntrypoint
  implements IEvaluatedEntrypoint
{
  public readonly evaluated = true;

  public readonly ignored = false;
}
