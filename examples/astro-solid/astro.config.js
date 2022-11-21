import { defineConfig } from 'astro/config';
import astro_solid from '@astrojs/solid-js';
import vite_linaria from '@linaria/vite';
import vite_inspect from 'vite-plugin-inspect';

export default defineConfig({
  output: 'static',
  srcDir: '.',
  root: '.',
  integrations: [astro_solid()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  build: {
    format: 'file',
  },
  vite: {
    plugins: [
      vite_linaria({
        displayName: true,
        classNameSlug: (hash, title, args) => `${args.dir}_${title}_${hash}`,
        babelOptions: {
          presets: ['solid'],
        },
      }),
      vite_inspect(),
    ],
    css: {
      modules: false,
    },
  },
});
