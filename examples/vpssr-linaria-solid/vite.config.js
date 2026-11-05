import vike from 'vike/plugin';
import vikeSolid from 'vike-solid/vite';
import vite_wyw from '@wyw-in-js/vite';

export default () => {
  /** @type import('vite').UserConfig */
  const config = {
    plugins: [
      {
        ...vite_wyw({
          babelOptions: {
            presets: [
              'solid',
              [
                '@babel/preset-typescript',
                {
                  isTSX: true,
                  allExtensions: true,
                },
              ],
            ],
          },
        }),
        enforce: 'pre',
      },
      vikeSolid(),
      vike(),
    ],
  };
  return config;
};
