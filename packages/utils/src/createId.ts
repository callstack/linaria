import type { Identifier, SourceLocation } from '@babel/types';

export const createId = (
  name: string,
  loc?: SourceLocation | null
): Identifier => ({
  type: 'Identifier',
  name,
  loc,
});
