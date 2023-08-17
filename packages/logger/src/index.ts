import genericDebug from 'debug';
import type { Debugger } from 'debug';
import pc from 'picocolors';

export type { Debugger };

export const linariaLogger = genericDebug('linaria');

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

genericDebug.formatters.r = (
  ref: string | { namespace: string; text?: string }
) => {
  const namespace = typeof ref === 'string' ? ref : ref.namespace;
  const text = typeof ref === 'string' ? namespace : ref.text ?? namespace;
  const color = parseInt(gerOrCreate(namespace).color, 10);
  const colorCode = `\u001B[3${color < 8 ? color : `8;5;${color}`}`;
  return `${colorCode};1m${text}\u001B[0m`;
};

genericDebug.formatters.f = function f(fn: () => unknown) {
  return JSON.stringify(fn());
};

const format = <T>(text: T) => {
  if (typeof text === 'string') {
    return text.replace(/\n/g, '\n\t');
  }

  return text;
};

export function enableDebug(namespace = 'linaria:*') {
  genericDebug.enable(namespace);
}

export function debug(
  namespaces: string,
  template: unknown | (() => void),
  ...restArgs: unknown[]
) {
  const logger = gerOrCreate(namespaces);
  if (!logger.enabled) return;

  if (typeof template === 'function') {
    const text = template();
    if (text) {
      logger(format(text), ...restArgs);
    }
    return;
  }

  logger(format(template), ...restArgs);
}

export const notify = (message: string) => {
  // eslint-disable-next-line no-console
  console.log(
    pc.red(
      message.replace(/(`.*?`)/g, (s) =>
        pc.italic(s.substring(1, s.length - 1))
      )
    )
  );
};

const padStart = (num: number, len: number) =>
  num.toString(10).padStart(len, '0');

export type CustomDebug = (
  namespace: string,
  template: string,
  ...args: unknown[]
) => void;

export function createCustomDebug(name: string, id: number): CustomDebug {
  return (..._args: Parameters<typeof debug>) => {
    const [namespace, arg1, ...args] = _args;
    debug(`${name}:${padStart(id, 5)}`, `[${namespace}] ${arg1}`, ...args);
  };
}
