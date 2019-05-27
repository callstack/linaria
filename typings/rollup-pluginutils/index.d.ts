declare module 'rollup-pluginutils' {
  export function createFilter(
    include?: string | string[],
    exclude?: string | string[]
  ): (testValue: string) => boolean;
}
