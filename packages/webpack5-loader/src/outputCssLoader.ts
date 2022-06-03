import type webpack from 'webpack';

import type { ICache } from './cache';
import { getCacheInstance } from './cache';

export default function outputCssLoader(
  this: webpack.LoaderContext<{ cacheProvider: string | ICache | undefined }>
) {
  this.async();
  const { cacheProvider } = this.getOptions();
  getCacheInstance(cacheProvider)
    .then((cacheInstance) => cacheInstance.get(this.resourcePath))
    .then((result) => this.callback(null, result))
    .catch((err: Error) => this.callback(err));
}
