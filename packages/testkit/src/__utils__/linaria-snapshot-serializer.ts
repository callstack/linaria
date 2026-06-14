import { extname, relative, resolve } from 'path';

import type { WYWTransformMetadata } from '@wyw-in-js/transform';
import { withTransformMetadata } from '@wyw-in-js/transform';

type Serializer<T> = {
  serialize: (value: T) => string;
  test: (value: unknown) => value is T;
};

const fixturesRoot = resolve(__dirname, '..');

const formatDependency = (dependency: string): string => {
  if (!dependency.startsWith(fixturesRoot)) {
    return dependency;
  }

  const relativeDependency = `./${relative(fixturesRoot, dependency).replace(
    /\\/g,
    '/'
  )}`;
  const extension = extname(relativeDependency);

  return extension === '.js'
    ? relativeDependency.slice(0, -extension.length)
    : relativeDependency;
};

export default {
  test: withTransformMetadata,
  serialize: ({ wywInJS }) => `
CSS:

${Object.keys(wywInJS.rules ?? {})
  .map((selector) =>
    wywInJS.rules[selector].atom
      ? wywInJS.rules[selector].cssText
      : `${selector} {${wywInJS.rules[selector].cssText}}`
  )
  .join('\n')}

Dependencies: ${
    wywInJS.dependencies?.length
      ? wywInJS.dependencies.map(formatDependency).join(', ')
      : 'NA'
  }
`,
} as Serializer<{ wywInJS: WYWTransformMetadata & { rules?: any } }>;
