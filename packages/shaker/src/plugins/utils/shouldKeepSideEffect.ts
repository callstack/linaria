const EXT_REGEX = /\.[0-9a-z]+$/;
const ALLOWED_EXTENSIONS = ['.js', '.cjs', '.mjs'];

export default function shouldKeepSideEffect(importPath: string) {
  const [ext] = importPath.match(EXT_REGEX) || [''];

  return ext === '' || ALLOWED_EXTENSIONS.includes(ext);
}
