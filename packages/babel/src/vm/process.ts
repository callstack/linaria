/**
 * It contains API for mocked process variable available in node environment used to evaluate scripts with node's `vm` in ./module.ts
 */
export const nextTick = (fn: (...args: unknown[]) => void) => setTimeout(fn, 0);

export const platform = 'browser';
export const arch = 'browser';
export const execPath = 'browser';
export const title = 'browser';
export const pid = 1;
export const browser = true;
export const argv = [];

export const binding = function binding() {
  throw new Error('No such module. (Possibly not yet loaded)');
};

export const cwd = () => '/';

const noop = () => {};
export const exit = noop;
export const kill = noop;
export const chdir = noop;
export const umask = noop;
export const dlopen = noop;
export const uptime = noop;
export const memoryUsage = noop;
export const uvCounters = noop;
export const features = {};

export const { env } = process;
