import type { Compiler } from 'webpack';

import type { EventEmitter, IFileReporterOptions } from '@linaria/utils';
import { createFileReporter } from '@linaria/utils';

export const sharedState: {
  emitter?: EventEmitter;
} = {};

export class LinariaDebugPlugin {
  private readonly onDone: (root: string) => void;

  constructor(options?: IFileReporterOptions) {
    const { emitter, onDone } = createFileReporter(options ?? false);
    sharedState.emitter = emitter;
    this.onDone = onDone;
  }

  apply(compiler: Compiler) {
    compiler.hooks.shutdown.tap('LinariaDebug', () => {
      this.onDone(process.cwd());
    });
  }
}
