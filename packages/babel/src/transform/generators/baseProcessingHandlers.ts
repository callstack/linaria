import type {
  SyncScenarioForAction,
  ICollectAction,
  IEvalAction,
  IExtractAction,
  IWorkflowAction,
  ActionQueueItem,
} from '../types';

import { addToCodeCache } from './addToCodeCache';
import { explodeReexports } from './explodeReexports';
import { getExports } from './getExports';
import { processEntrypoint } from './processEntrypoint';
import { processImports } from './processImports';
import { transform } from './transform';

// eslint-disable-next-line require-yield
function* emptyHandler<T extends ActionQueueItem<'sync'>>(
  this: T
): SyncScenarioForAction<T> {
  throw new Error(`Handler for ${this.type} is not implemented`);
}

export const baseProcessingHandlers = {
  collect: emptyHandler<ICollectAction<'sync'>>,
  evalFile: emptyHandler<IEvalAction<'sync'>>,
  extract: emptyHandler<IExtractAction<'sync'>>,
  workflow: emptyHandler<IWorkflowAction<'sync'>>,
  addToCodeCache,
  explodeReexports,
  getExports,
  processEntrypoint,
  processImports,
  transform,
};
