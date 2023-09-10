/* eslint-disable no-console */
import path from 'path';

import type {
  OnAction,
  OnEvent,
  OnActionFinishArgs,
  OnActionStartArgs,
} from '../EventEmitter';
import { EventEmitter, isOnActionStartArgs } from '../EventEmitter';

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

interface IAction {
  entrypointRef: string;
  error?: unknown;
  finishedAt?: number;
  idx: string;
  isAsync?: boolean;
  result?: 'finished' | 'failed';
  startedAt: number;
  type: string;
}

const formatTime = (timestamps: number | undefined) => {
  if (!timestamps) {
    return 'unfinished';
  }

  const date = new Date(performance.timeOrigin + timestamps);
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

function printActions(actions: IAction[]) {
  const actionsIdx = new Set<string>();
  const actionsByType = new Map<string, Set<string>>();
  const actionsByEntrypoint = new Map<string, Set<string>>();

  const getIdx = (action: IAction) => action.idx.split(':')[0];

  actions.forEach((action) => {
    actionsIdx.add(getIdx(action));

    if (!actionsByType.has(action.type)) {
      actionsByType.set(action.type, new Set());
    }

    actionsByType.get(action.type)!.add(getIdx(action));

    if (!actionsByEntrypoint.has(action.entrypointRef)) {
      actionsByEntrypoint.set(action.entrypointRef, new Set());
    }

    actionsByEntrypoint.get(action.entrypointRef)!.add(getIdx(action));
  });

  console.log('\nActions:');
  console.log(`  Total: ${actionsIdx.size}`);
  console.log(`  By type:`);
  Array.from(actionsByType.entries())
    .sort(([, a], [, b]) => b.size - a.size)
    .forEach(([type, set]) => {
      console.log(`    ${type}: ${set.size}`);
    });
  console.log(`  By entrypoint (top 10):`);
  Array.from(actionsByEntrypoint.entries())
    .sort(([, a], [, b]) => b.size - a.size)
    .slice(0, 10)
    .forEach(([entrypoint, set]) => {
      console.log(`    ${entrypoint}: ${set.size}`);
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

  const processSingleEvent = (
    meta: Record<string, unknown> | IProcessedEvent | IQueueActionEvent
  ) => {
    if (meta.type === 'dependency') {
      processDependencyEvent(meta as IProcessedEvent);
    }
  };

  const startTimes = new Map<string, number>();

  const onEvent: OnEvent = (meta, type) => {
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
  };

  const actions: IAction[] = [];

  const onAction: OnAction = (
    ...args: OnActionStartArgs | OnActionFinishArgs
  ) => {
    if (isOnActionStartArgs(args)) {
      const [, timestamp, type, idx, entrypointRef] = args;
      const id = actions.length;
      actions.push({
        entrypointRef,
        idx,
        startedAt: timestamp,
        type,
      });

      return id;
    }

    const [result, timestamp, id, isAsync, error] = args;
    actions[id].error = error;
    actions[id].finishedAt = timestamp;
    actions[id].isAsync = isAsync;
    actions[id].result = `${result}ed`;

    addTiming(
      'actions',
      `${isAsync ? 'async' : 'sync'} ${actions[id].type}`,
      timestamp - actions[id].startedAt
    );

    return id;
  };

  const emitter = new EventEmitter(onEvent, onAction, () => {});

  return {
    emitter,
    onDone: (sourceRoot: string) => {
      if (options === true || options.print) {
        printTimings(timings, startedAt, sourceRoot);

        console.log(
          '\nNumber of processed dependencies:',
          processedDependencies.size
        );

        printActions(actions);

        console.log('\nMemory usage:', process.memoryUsage());
      }

      if (options !== true && options.filename) {
        const fs = require('fs');
        fs.writeFileSync(
          options.filename,
          JSON.stringify(
            {
              processedDependencies,
              actions: actions.map(({ finishedAt, ...action }) => ({
                ...action,
                duration: finishedAt
                  ? finishedAt - action.startedAt
                  : 'unfinished',
                startedAt: formatTime(action.startedAt),
              })),
              timings,
            },
            replacer,
            2
          )
        );
      }

      actions.length = 0;
      timings.clear();
      processedDependencies.clear();
    },
  };
};
