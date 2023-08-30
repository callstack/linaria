/* eslint-disable no-console */
import path from 'path';

import { EventEmitter } from '../EventEmitter';

type Timings = Map<string, Map<string, number>>;

export interface IPerfMeterOptions {
  filename?: string;
  print?: boolean;
}

interface IProcessedDependency {
  exports: string[];
  fileIdx: string;
  imports: { from: string; what: string[] }[];
  passes: number;
}

export interface IProcessedEvent {
  file: string;
  fileIdx: string;
  imports: { from: string; what: string[] }[];
  only: string[];
  type: 'dependency';
}

export interface IQueueActionEvent {
  action: string;
  args?: string[];
  datetime: Date;
  file: string;
  queueIdx: string;
  type: 'queue-action';
}

const formatTime = (date: Date) => {
  return `${date.toLocaleTimeString()}.${date
    .getMilliseconds()
    .toString()
    .padStart(3, '0')}`;
};

const workingDir = process.cwd();

function replacer(_key: string, value: unknown): unknown {
  if (typeof value === 'string' && path.isAbsolute(value)) {
    return path.relative(workingDir, value);
  }

  if (value instanceof Map) {
    return Array.from(value.entries()).reduce((obj, [k, v]) => {
      const key = replacer(k, k) as string;
      return {
        ...obj,
        [key]: replacer(key, v),
      };
    }, {});
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
    array
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([value, time]) => {
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

  const processedDependencies = new Map<string, IProcessedDependency>();
  const processDependencyEvent = ({
    file,
    only,
    imports,
    fileIdx,
  }: IProcessedEvent) => {
    if (!processedDependencies.has(file)) {
      processedDependencies.set(file, {
        exports: [],
        imports: [],
        passes: 0,
        fileIdx,
      });
    }

    const processed = processedDependencies.get(file)!;
    processed.passes += 1;
    processed.exports = only;
    processed.imports = imports;
  };

  const queueActions = new Map<string, string[]>();
  const processQueueAction = ({
    file,
    action,
    args,
    queueIdx,
    datetime,
  }: IQueueActionEvent) => {
    if (!queueActions.has(file)) {
      queueActions.set(file, []);
    }

    const stringifiedArgs =
      args?.map((arg) => JSON.stringify(arg)).join(', ') ?? '';
    queueActions
      .get(file)!
      .push(
        `${queueIdx}:${action}(${stringifiedArgs})@${formatTime(datetime)}`
      );
  };

  const processSingleEvent = (
    meta: Record<string, unknown> | IProcessedEvent | IQueueActionEvent
  ) => {
    if (meta.type === 'dependency') {
      processDependencyEvent(meta as IProcessedEvent);
    }

    if (meta.type === 'queue-action') {
      processQueueAction(meta as IQueueActionEvent);
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
          JSON.stringify(
            {
              processedDependencies,
              queueActions,
              timings,
            },
            replacer,
            2
          )
        );
      }
    },
  };
};
