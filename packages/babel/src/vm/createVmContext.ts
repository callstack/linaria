import * as vm from 'vm';

import { Window } from 'happy-dom';

import * as process from './process';

const NOOP = () => {};

function createWindow(): Window {
  const win = new Window();

  // TODO: browser doesn't expose Buffer, but a lot of dependencies use it
  win.Buffer = Buffer;
  win.Uint8Array = Uint8Array;

  return win;
}

function createBaseContext(
  win: Window,
  additionalContext: Partial<vm.Context>
): Partial<vm.Context> {
  const baseContext: vm.Context = win;

  baseContext.document = win.document;
  baseContext.window = win;
  baseContext.self = win;
  baseContext.top = win;
  baseContext.parent = win;
  baseContext.global = win;

  baseContext.process = process;

  baseContext.clearImmediate = NOOP;
  baseContext.clearInterval = NOOP;
  baseContext.clearTimeout = NOOP;
  baseContext.setImmediate = NOOP;
  baseContext.requestAnimationFrame = NOOP;
  baseContext.setInterval = NOOP;
  baseContext.setTimeout = NOOP;

  // eslint-disable-next-line
  for (const key in additionalContext) {
    baseContext[key] = additionalContext[key];
  }

  return baseContext;
}

function createVmContext(additionalContext: Partial<vm.Context>) {
  const window = createWindow();
  const baseContext = createBaseContext(window, additionalContext);

  const context = vm.createContext(baseContext);

  return {
    context,
    teardown: () => {
      window.happyDOM.cancelAsync();
    },
  };
}

export default createVmContext;
