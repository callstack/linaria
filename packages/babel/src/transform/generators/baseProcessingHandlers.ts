import type {
  SyncScenarioForAction,
  ICollectAction,
  IEvalAction,
  IExtractAction,
  IWorkflowAction,
  ActionQueueItem,
} from '../types';

import { explodeReexports } from './explodeReexports';
import { getExports } from './getExports';
import { processEntrypoint } from './processEntrypoint';
import { processImports } from './processImports';
import { transform } from './transform';

// eslint-disable-next-line require-yield
function* emptyHandler<T extends ActionQueueItem>(
  this: T
): SyncScenarioForAction<T> {
  throw new Error(`Handler for ${this.type} is not implemented`);
}

export const baseProcessingHandlers = {
  collect: emptyHandler<ICollectAction>,
  evalFile: emptyHandler<IEvalAction>,
  extract: emptyHandler<IExtractAction>,
  workflow: emptyHandler<IWorkflowAction>,
  explodeReexports,
  getExports,
  processEntrypoint,
  processImports,
  transform,
};
