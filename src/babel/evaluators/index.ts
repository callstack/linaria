// TypeScript Version: 3.2
/**
 * This file is an entry point for module evaluation for getting lazy dependencies.
 */

import Module from '../module';
import type { StrictOptions } from '../types';
import { Core } from '../babel';

export default function evaluate(
  code: string,
  babel: Core,
  filename: string,
  options: StrictOptions
) {
  const m = new Module(babel, filename, options);

  m.dependencies = [];
  m.evaluate(code, ['__linariaPreval']);

  return {
    value: m.exports,
    dependencies: m.dependencies,
  };
}
