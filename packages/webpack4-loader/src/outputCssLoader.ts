import loaderUtils from 'loader-utils';
import { getCacheInstance } from './cache';

type LoaderContext = Parameters<typeof loaderUtils.getOptions>[0];

export default function outputCssLoader(this: LoaderContext) {
  this.async();
  const { cacheProvider } = loaderUtils.getOptions(this) || {};
  getCacheInstance(cacheProvider)
    .then((cacheInstance) => cacheInstance.get(this.resourcePath))
    .then((result) => this.callback(null, result))
    .catch((err: Error) => this.callback(err));
}
