import type { IEvaluatorMetadata, LinariaMetadata } from './types';

export const hasEvaluatorMetadata = (
  metadata: object | undefined
): metadata is {
  linariaEvaluator: IEvaluatorMetadata;
  linaria: LinariaMetadata | undefined;
} => metadata !== undefined && 'linariaEvaluator' in metadata;
