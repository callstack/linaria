import { transformSync } from '@swc/core';

export default function minifyCode(source: string): string {
  const { code } = transformSync(source, {
    sourceMaps: false,
    swcrc: false,

    module: {
      type: 'commonjs',
    },
    minify: false,

    jsc: {
      parser: {
        syntax: 'ecmascript',
      },
      minify: {
        compress: true,
        mangle: false,
      },
    },
  });

  return code;
}
