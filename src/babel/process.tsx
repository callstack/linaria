/* eslint-disable no-multi-assign */

export const nextTick = (fn: Function) => setTimeout(fn, 0);

export const platform = exports.arch = exports.execPath = exports.title = 'browser';
export const pid = 1;
export const browser = true;
export const argv = [];

export const binding = function binding() {
  throw new Error('No such module. (Possibly not yet loaded)');
};

export const cwd = () => '/';

export const exit = exports.kill = exports.chdir = exports.umask = exports.dlopen = exports.uptime = exports.memoryUsage = exports.uvCounters = () => {};
export const features = {};

export const env = {
  NODE_ENV: process.env.NODE_ENV,
};
