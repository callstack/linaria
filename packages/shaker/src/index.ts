import type { Evaluator } from '@linaria/utils';

import exportMarkerPlugin from './plugins/export-marker-plugin';
import minifyCode from './plugins/minify-code';

const shaker: Evaluator = (filename, options, text, only, babel) => {
  const sortedOnly = [...(only ?? [])];
  sortedOnly.sort();

  const transformed = babel.transformSync(text, {
    ast: false,
    caller: {
      name: 'linaria',
    },
    sourceMaps: false,
    plugins: [[exportMarkerPlugin, { onlyExports: sortedOnly }]],
  });

  if (!transformed || !transformed.code) {
    throw new Error(`${filename} cannot be transformed`);
  }

  const minifiedCode = minifyCode(transformed.code);

  return [minifiedCode, new Map() /* TODO parse imports */];
};

export default shaker;
