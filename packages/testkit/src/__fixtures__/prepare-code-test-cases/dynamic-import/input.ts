// *

export function foo(onImport) {
  import('./foo').then(onImport);
}
