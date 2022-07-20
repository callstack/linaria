import type { StyledMeta } from '../types';

export default function hasMeta(value: unknown): value is StyledMeta {
  return typeof value === 'object' && value !== null && '__linaria' in value;
}
