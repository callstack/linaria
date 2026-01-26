declare module 'react/jsx-runtime' {
  const Fragment: unknown;
  function jsx(type: unknown, props: unknown, key?: unknown): unknown;
  function jsxs(type: unknown, props: unknown, key?: unknown): unknown;
}

declare module 'react/jsx-dev-runtime' {
  const Fragment: unknown;
  function jsxDEV(
    type: unknown,
    props: unknown,
    key: unknown,
    isStaticChildren: boolean,
    source: unknown,
    self: unknown
  ): unknown;
}
