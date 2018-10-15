declare module "rollup-pluginutils" {
  declare export function createFilter(
    include?: string | string[],
    exclude?: string | string[]
  ): Function;
}
