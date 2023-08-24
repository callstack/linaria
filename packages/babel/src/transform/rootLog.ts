import type { Debugger } from '@linaria/logger';
import { linariaLogger } from '@linaria/logger';

export const rootLog: Debugger = linariaLogger.extend('transform');
