import genericDebug, { Debugger } from 'debug';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const levels = ['error', 'warn', 'info', 'debug'];
const currentLevel = levels.indexOf(process.env.LINARIA_LOG || 'error');

const loggers = new Map<string, Debugger>();
const gerOrCreate = (namespaces: string): Debugger => {
  if (!loggers.has(namespaces)) {
    loggers.set(namespaces, genericDebug(namespaces));
  }

  return loggers.get(namespaces)!;
};

const format = <T>(text: T) => {
  if (typeof text === 'string') {
    return text.replace(/\n/g, '\n\t');
  }

  return text;
};

function log(
  level: LogLevel,
  namespaces: string,
  arg1: any | (() => void),
  ...restArgs: any[]
) {
  if (currentLevel < levels.indexOf(level)) {
    return;
  }

  const logger = gerOrCreate(`linaria:${namespaces}`);
  if (!logger.enabled) return;

  if (typeof arg1 === 'function') {
    const text = arg1();
    if (text) {
      logger('', format(text), ...restArgs);
    }
    return;
  }

  logger('', format(arg1), ...restArgs);
}

export const debug = log.bind(null, 'debug');
export const info = log.bind(null, 'info');
export const warn = log.bind(null, 'warn');
export const error = log.bind(null, 'error');
