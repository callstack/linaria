import { dirname, isAbsolute } from 'path';

import findUp from 'find-up';

const cache = new Map<string, string | undefined>();

export function findPackageJSON(
  pkgName: string,
  filename: string | null | undefined
) {
  try {
    const pkgPath =
      pkgName === '.' && filename && isAbsolute(filename)
        ? filename
        : require.resolve(
            pkgName,
            filename ? { paths: [dirname(filename)] } : {}
          );
    if (!cache.has(pkgPath)) {
      cache.set(pkgPath, findUp.sync('package.json', { cwd: pkgPath }));
    }

    return cache.get(pkgPath);
  } catch (er: unknown) {
    if (
      typeof er === 'object' &&
      er !== null &&
      (er as { code?: unknown }).code === 'MODULE_NOT_FOUND'
    ) {
      return undefined;
    }

    throw er;
  }
}
