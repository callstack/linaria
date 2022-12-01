import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import linaria from '@linaria/vite';

export default defineConfig({
  plugins: [
    {
      ...linaria({
        include: ['./src/**/*.tsx'],
        babelOptions: {
          overrides: [
            {
              test: ['./src/**/*.tsx'],
              presets: ['typescript', 'solid'],
            },
          ],
        },
      }),
      enforce: 'pre'
    },
    solidPlugin(),
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});
