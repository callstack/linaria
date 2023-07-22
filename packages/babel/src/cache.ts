import { createHash } from 'crypto';

import type { File } from '@babel/types';

import type Module from './module';
import type { ITransformFileResult } from './types';

function hashContent(content: string) {
  return createHash('sha256').update(content).digest('hex');
}

export class TransformCacheCollection {
  private contentHashes = new Map<string, string>();

  constructor(
    public readonly resolveCache: Map<string, string> = new Map(),
    public readonly codeCache: Map<
      string,
      {
        imports: Map<string, string[]> | null;
        only: string[];
        result: ITransformFileResult;
      }
    > = new Map(),
    public readonly evalCache: Map<string, Module> = new Map(),
    public readonly originalASTCache: Map<string, File> = new Map()
  ) {}

  public invalidateForFile(filename: string) {
    this.resolveCache.delete(filename);
    this.codeCache.delete(filename);
    this.evalCache.delete(filename);
    this.originalASTCache.delete(filename);
  }

  public invalidateIfChanged(filename: string, content: string) {
    const hash = this.contentHashes.get(filename);
    const newHash = hashContent(content);

    if (hash !== newHash) {
      this.contentHashes.set(filename, newHash);
      this.invalidateForFile(filename);
    }
  }
}
