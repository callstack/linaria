/* eslint-disable no-console */
import path from 'path';

import { EventEmitter } from '../EventEmitter';

type Timings = Map<string, Map<string, number>>;

export interface IPerfMeterOptions {
  filename?: string;
  print?: boolean;
}

interface IProcessedFile {
  exports: string[];
  imports: { from: string; what: string[] }[];
  passes: number;
}

export interface IProcessedEvent {
  type: 'dependency';
  file: string;
  only: string[];
  imports: { from: string; what: string[] }[];
}

function replacer(key: string, value: unknown) {
  if (value instanceof Map) {
    return Array.from(value.entries()).reduce(
      (obj, [k, v]) => ({
        ...obj,
        [k]: v,
      }),
      {}
    );
  }

  return value;
}

function printTimings(timings: Timings, startedAt: number, sourceRoot: string) {
  if (timings.size === 0) {
    return;
  }

  console.log(`\nTimings:`);
  console.log(`  Total: ${(performance.now() - startedAt).toFixed()}ms`);

  Array.from(timings.entries()).forEach(([label, byLabel]) => {
    console.log(`\n  By ${label}:`);

    const array = Array.from(byLabel.entries());
    // array.sort(([, a], [, b]) => b - a);
    array.forEach(([value, time]) => {
      const name = value.startsWith(sourceRoot)
        ? path.relative(sourceRoot, value)
        : value;
      console.log(`    ${name}: ${time}ms`);
    });
  });
}

export const createPerfMeter = (
  options: IPerfMeterOptions | boolean = true
) => {
  if (!options) {
    return {
      emitter: EventEmitter.dummy,
      onDone: () => {},
    };
  }

  const startedAt = performance.now();
  const timings: Timings = new Map();
  const addTiming = (label: string, key: string, value: number) => {
    if (!timings.has(label)) {
      timings.set(label, new Map());
    }

    const forLabel = timings.get(label)!;
    forLabel.set(key, Math.round((forLabel.get(key) || 0) + value));
  };

  const processedFiles = new Map<string, IProcessedFile>();
  const processDependencyEvent = ({ file, only, imports }: IProcessedEvent) => {
    if (!processedFiles.has(file)) {
      processedFiles.set(file, {
        exports: [],
        imports: [],
        passes: 0,
      });
    }

    const processed = processedFiles.get(file)!;
    processed.passes += 1;
    processed.exports = only;
    processed.imports = imports;
  };

  const processSingleEvent = (
    meta: Record<string, unknown> | IProcessedEvent
  ) => {
    if (meta.type === 'dependency') {
      processDependencyEvent(meta as IProcessedEvent);
    }
  };

  const startTimes = new Map<string, number>();
  const emitter = new EventEmitter((meta, type) => {
    if (type === 'single') {
      processSingleEvent(meta);
      return;
    }

    if (type === 'start') {
      Object.entries(meta).forEach(([label, value]) => {
        startTimes.set(`${label}\0${value}`, performance.now());
      });
    } else {
      Object.entries(meta).forEach(([label, value]) => {
        const startTime = startTimes.get(`${label}\0${value}`);
        if (startTime) {
          addTiming(label, String(value), performance.now() - startTime);
        }
      });
    }
  });

  return {
    emitter,
    onDone: (sourceRoot: string) => {
      if (options === true || options.print) {
        printTimings(timings, startedAt, sourceRoot);
      }

      if (options !== true && options.filename) {
        const fs = require('fs');
        fs.writeFileSync(
          options.filename,
          JSON.stringify({ processedFiles, timings }, replacer, 2)
        );
      }
    },
  };
};
