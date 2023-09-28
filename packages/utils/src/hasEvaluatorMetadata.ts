import type { IMetadata } from './types';

export const hasEvaluatorMetadata = (
  metadata: object | undefined
): metadata is IMetadata =>
  metadata !== undefined && 'linariaEvaluator' in metadata;
