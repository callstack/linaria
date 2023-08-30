import { BaseEntrypoint } from './BaseEntrypoint';

export class EvaluatedEntrypoint extends BaseEntrypoint {
  public readonly evaluated = true;

  public readonly ignored = false;
}
