import linaria from '@linaria/rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    nodeResolve({
      extensions: ['.jsx', '.js'],
    }),
    {
      ...linaria({
        include: ['**/*.{js,jsx}'],
      }),
      enforce: 'pre',
    },
    react({
      jsxRuntime: 'classic',
    }),
  ],
  build: {
    outDir: 'build',
    target: command === 'serve' ? 'modules' : 'es2015',
  },
}));
