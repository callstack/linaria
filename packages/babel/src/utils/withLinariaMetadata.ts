import type { LinariaMetadata } from '@linaria/utils';

const withLinariaMetadata = (
  value: unknown
): value is { linaria: LinariaMetadata } =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { linaria: unknown }).linaria === 'object';

export default withLinariaMetadata;
