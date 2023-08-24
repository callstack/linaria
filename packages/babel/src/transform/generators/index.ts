import { addToCodeCache } from './addToCodeCache';
import { collect } from './collect';
import { evalFile } from './evalFile';
import { explodeReexports } from './explodeReexports';
import { extract } from './extract';
import { getExports } from './getExports';
import { processEntrypoint } from './processEntrypoint';
import { processImports } from './processImports';
import { transform } from './transform';
import { workflow } from './workflow';

export const baseHandlers = {
  addToCodeCache,
  explodeReexports,
  getExports,
  processEntrypoint,
  processImports,
  transform,
  collect,
  evalFile,
  extract,
  workflow,
};
