type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const levels = ['error', 'warn', 'info', 'debug'];
const currentLevel = levels.indexOf(process.env.LINARIA_LOG || 'error');

function log(level: LogLevel, arg1: any | (() => void), ...restArgs: any[]) {
  if (currentLevel < levels.indexOf(level)) {
    return;
  }

  if (typeof arg1 === 'function') {
    const text = arg1();
    if (text) {
      process.stdout.write(
        [level.toUpperCase(), text, ...restArgs].join(' ') + '\n'
      );
    }
    return;
  }

  process.stdout.write(
    [level.toUpperCase(), arg1, ...restArgs].join(' ') + '\n'
  );
}

export const debug = log.bind(null, 'debug');
export const info = log.bind(null, 'info');
export const warn = log.bind(null, 'warn');
export const error = log.bind(null, 'error');
