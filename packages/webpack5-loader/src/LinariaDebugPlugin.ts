import type { Compiler } from 'webpack';

import type { EventEmitter, IPerfMeterOptions } from '@linaria/utils';
import { createPerfMeter } from '@linaria/utils';

export const sharedState: {
  emitter?: EventEmitter;
} = {};

export class LinariaDebugPlugin {
  private readonly onDone: (root: string) => void;

  constructor(options?: IPerfMeterOptions) {
    const { emitter, onDone } = createPerfMeter(options ?? true);
    sharedState.emitter = emitter;
    this.onDone = onDone;
  }

  apply(compiler: Compiler) {
    compiler.hooks.shutdown.tap('LinariaDebug', () => {
      this.onDone(process.cwd());
    });
  }
}
