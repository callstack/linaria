import genericDebug from 'debug';
import type { Debugger } from 'debug';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const levels = ['error', 'warn', 'info', 'debug'];
const currentLevel = levels.indexOf(process.env.LINARIA_LOG || 'error');

const linariaLogger = genericDebug('linaria');

const loggers = new Map<string, Debugger>();

function gerOrCreate(namespace: string | null | undefined): Debugger {
  if (!namespace) return linariaLogger;
  const lastIndexOf = namespace.lastIndexOf(':');
  if (!loggers.has(namespace)) {
    loggers.set(
      namespace,
      gerOrCreate(namespace.substr(0, lastIndexOf)).extend(
        namespace.substr(lastIndexOf + 1)
      )
    );
  }

  return loggers.get(namespace)!;
}

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

  const logger = gerOrCreate(namespaces);
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
