// TypeScript Version: 3.2

import Module from '../module';
import { StrictOptions } from '../types';

export default function evaluate(
  code: string,
  t: any,
  filename: string,
  options: StrictOptions
) {
  const m = new Module(filename, options);

  m.dependencies = [];
  m.evaluate(code, ['__linariaPreval']);

  return {
    value: m.exports,
    dependencies: m.dependencies,
  };
}
