import { withLinariaMetadata } from '@linaria/babel-preset';
import type { LinariaMetadata } from '@linaria/utils';

type Serializer<T> = {
  test: (value: unknown) => value is T;
  serialize: (value: T) => string;
};

export default {
  test: withLinariaMetadata,
  serialize: ({ linaria }) => `
CSS:

${Object.keys(linaria.rules ?? {})
  .map((selector) =>
    linaria.rules[selector].atom
      ? linaria.rules[selector].cssText
      : `${selector} {${linaria.rules[selector].cssText}}`
  )
  .join('\n')}

Dependencies: ${
    linaria.dependencies?.length ? linaria.dependencies.join(', ') : 'NA'
  }
`,
} as Serializer<{ linaria: LinariaMetadata & { rules?: any } }>;
