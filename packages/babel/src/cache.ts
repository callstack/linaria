import type Module from './module';
import type { ITransformFileResult } from './types';

export class TransformCacheCollection {
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
    public readonly evalCache: Map<string, Module> = new Map()
  ) {}
}
