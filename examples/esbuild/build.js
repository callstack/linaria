const linaria = require('@linaria/esbuild').default;

const prod = process.env.NODE_ENV === 'production';

require('esbuild')
  .build({
    bundle: true,
    entryPoints: ['app.js'],
    loader: {
      '.svg': 'file',
      '.png': 'file',
    },
    minify: prod,
    outfile: 'build/out.js',
    plugins: [
      linaria({
        sourceMap: prod,
      }),
    ],
  })
  .catch(() => process.exit(1));
