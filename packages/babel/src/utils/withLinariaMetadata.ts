import type { LinariaMetadata } from '@linaria/utils';

export const getLinariaMetadata = (
  value: unknown
): LinariaMetadata | undefined => {
  if (typeof value === 'object' && value !== null) {
    const metadata = (value as { linaria: unknown }).linaria;
    if (typeof metadata === 'object' && metadata !== null) {
      // eslint-disable-next-line no-param-reassign
      delete (value as { linaria: unknown }).linaria;
      return metadata as LinariaMetadata;
    }
  }

  return undefined;
};

const withLinariaMetadata = (
  value: unknown
): value is { linaria: LinariaMetadata } =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { linaria: unknown }).linaria === 'object';

export default withLinariaMetadata;
