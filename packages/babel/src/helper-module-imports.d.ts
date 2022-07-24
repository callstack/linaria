declare module '@babel/helper-module-imports' {
  import type { NodePath } from '@babel/traverse';
  import type { Identifier } from '@babel/types';

  function addNamed(
    path: NodePath,
    name: string,
    importedSource: string,
    opts?: { nameHint: string }
  ): Identifier;
}
