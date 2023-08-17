// *

export function foo(locale, onImport) {
  import(`./foo/${locale}`).then(onImport);
}
