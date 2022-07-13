/**
 * This file is an entry point for module evaluation for getting lazy dependencies.
 */

import Module from '../module';
import loadLinariaOptions from '../transform-stages/helpers/loadLinariaOptions';
import type { Options, CodeCache } from '../types';

export default function evaluate(
  resolveCache: Map<string, string>,
  codeCache: CodeCache,
  evalCache: Map<string, Module>,
  code: string[],
  options: Pick<Options, 'filename' | 'pluginOptions'>
) {
  const filename = options?.filename ?? 'unknown';
  const pluginOptions = loadLinariaOptions(options.pluginOptions);

  const m = new Module(
    filename ?? 'unknown',
    pluginOptions,
    resolveCache,
    codeCache,
    evalCache
  );

  m.dependencies = [];
  m.evaluate(code);

  return {
    value: m.exports,
    dependencies: m.dependencies,
    processors: m.tagProcessors,
  };
}
