/**
 * This file contains a Webpack loader for Linaria.
 * It uses the transform.ts function to generate class names from source code,
 * returns transformed code without template literals and attaches generated source maps
 */
import loaderUtils from 'loader-utils';
import type { RawSourceMap } from 'source-map';
declare type LoaderContext = Parameters<typeof loaderUtils.getOptions>[0];
export default function webpack4Loader(this: LoaderContext, content: string, inputSourceMap: RawSourceMap | null): void;
export {};
