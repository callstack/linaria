import linaria from '@linaria/rollup';
import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import image from '@rollup/plugin-image';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import css from 'rollup-plugin-css-only';

export default {
  input: 'app.js',
  output: {
    dir: 'build',
    format: 'cjs',
  },
  plugins: [
    image(),
    linaria({
      sourceMap: process.env.NODE_ENV !== 'production',
    }),
    css({
      output: 'styles.css',
    }),
    nodeResolve({
      extensions: ['.jsx', '.js'],
    }),
    commonjs(),
    babel({ babelHelpers: 'bundled' }),
  ],
};
