// Minimal React 17-like type surface for dtslint.
// It intentionally does NOT export a module-level `JSX` namespace.

declare namespace React {
  type ElementType = unknown;

  interface CSSProperties {
    [key: string]: unknown;
  }

  interface FunctionComponent<P = Record<string, unknown>> {
    (props: P & { children?: unknown }): unknown;
  }

  function createElement(...args: unknown[]): unknown;
}

export = React;
export as namespace React;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      button: Record<string, unknown>;
    }
  }
}
