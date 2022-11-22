import linaria from '@linaria/vite';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    nodeResolve({
      extensions: ['.jsx', '.js'],
    }),
    linaria({
      include: ['**/*.{js,jsx}'],
      babelOptions: {
        presets: ['@babel/preset-react'],
      },
    }),
    react({
      jsxRuntime: 'classic',
    }),
  ],
  build: {
    target: command === 'serve' ? 'modules' : 'es2015',
  },
}));
