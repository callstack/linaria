import type { LinariaMetadata } from '../src';

type Serializer<T> = {
  test: (value: unknown) => value is T;
  serialize: (value: T) => string;
};

const withLinariaMetadata = (
  value: unknown
): value is { linaria: LinariaMetadata } =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { linaria: unknown }).linaria === 'object';

export default {
  test: withLinariaMetadata,
  serialize: ({ linaria }) => `
CSS:

${Object.keys(linaria.rules)
  .map((selector) =>
    linaria.rules[selector].atom
      ? linaria.rules[selector].cssText
      : `${selector} {${linaria.rules[selector].cssText}}`
  )
  .join('\n')}

Dependencies: ${
    linaria.dependencies.length ? linaria.dependencies.join(', ') : 'NA'
  }
`,
} as Serializer<{ linaria: LinariaMetadata }>;
