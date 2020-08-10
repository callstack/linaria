import type { LinariaMetadata } from '../types';

type Serializer<T> = {
  test: (value: any) => value is T;
  print: (value: T) => string;
};

const withLinariaMetadata = (
  value: any
): value is { linaria: LinariaMetadata } =>
  value && typeof value.linaria === 'object';

export default {
  test: withLinariaMetadata,
  print: ({ linaria }) => `
CSS:

${Object.keys(linaria.rules)
  .map((selector) => `${selector} {${linaria.rules[selector].cssText}}`)
  .join('\n')}

Dependencies: ${
    linaria.dependencies.length ? linaria.dependencies.join(', ') : 'NA'
  }
`,
} as Serializer<{ linaria: LinariaMetadata }>;
