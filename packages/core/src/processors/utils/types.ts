export type ClassNameSlugVars = {
  dir: string;
  ext: string;
  file: string;
  hash: string;
  name: string;
  title: string;
};

export type ClassNameFn = (
  hash: string,
  title: string,
  args: ClassNameSlugVars
) => string;

export interface IOptions {
  classNameSlug?: string | ClassNameFn;
  displayName: boolean;
}
export interface IFileContext {
  filename: string;
  root: string;
}
