import loaderUtils from 'loader-utils';

import { getCacheInstance } from './cache';

type LoaderContext = Parameters<typeof loaderUtils.getOptions>[0];

export default async function outputCssLoader(this: LoaderContext) {
  this.async();
  const { cacheProvider } = loaderUtils.getOptions(this) || {};

  try {
    const cacheInstance = await getCacheInstance(cacheProvider);

    const result = await cacheInstance.get(this.resourcePath);
    const dependencies =
      (await cacheInstance.getDependencies?.(this.resourcePath)) ?? [];

    dependencies.forEach((dependency) => {
      this.addDependency(dependency);
    });

    this.callback(null, result);
  } catch (err) {
    this.callback(err as Error);
  }
}
