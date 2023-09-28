import * as vm from 'vm';

import type { Window } from 'happy-dom';

import type { FeatureFlags, StrictOptions } from '@linaria/utils';
import { isFeatureEnabled } from '@linaria/utils';

import * as process from './process';

const NOOP = () => {};

function createWindow(): Window {
  const { Window, GlobalWindow } = require('happy-dom');
  const HappyWindow = GlobalWindow || Window;
  const win = new HappyWindow();

  // TODO: browser doesn't expose Buffer, but a lot of dependencies use it
  win.Buffer = Buffer;
  win.Uint8Array = Uint8Array;

  return win;
}

function createBaseContext(
  win: Window | undefined,
  additionalContext: Partial<vm.Context>
): Partial<vm.Context> {
  const baseContext: vm.Context = win ?? {};

  baseContext.document = win?.document;
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

  // eslint-disable-next-line guard-for-in,no-restricted-syntax
  for (const key in additionalContext) {
    baseContext[key] = additionalContext[key];
  }

  return baseContext;
}

function createHappyDOMWindow() {
  const win = createWindow();

  return {
    teardown: () => {
      win.happyDOM.cancelAsync();
    },
    window: win,
  };
}

function createNothing() {
  return {
    teardown: () => {},
    window: undefined,
  };
}

export function createVmContext(
  filename: string,
  features: FeatureFlags<'happyDOM'>,
  additionalContext: Partial<vm.Context>,
  overrideContext: StrictOptions['overrideContext'] = (i) => i
) {
  const isHappyDOMEnabled = isFeatureEnabled(features, 'happyDOM', filename);

  const { teardown, window } = isHappyDOMEnabled
    ? createHappyDOMWindow()
    : createNothing();
  const baseContext = createBaseContext(
    window,
    overrideContext(
      {
        __filename: filename,
        ...additionalContext,
      },
      filename
    )
  );

  const context = vm.createContext(baseContext);

  return {
    context,
    teardown,
  };
}
