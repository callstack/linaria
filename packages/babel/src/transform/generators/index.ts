import { baseProcessingHandlers } from './baseProcessingHandlers';
import { collect } from './collect';
import { evalFile } from './evalFile';
import { extract } from './extract';
import { workflow } from './workflow';

export const baseHandlers = {
  ...baseProcessingHandlers,
  collect,
  evalFile,
  extract,
  workflow,
};
