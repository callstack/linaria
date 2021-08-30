import { ClassNameSlugVars } from '../types';

const isSlugVar = (
  key: string,
  slugVars: ClassNameSlugVars
): key is keyof ClassNameSlugVars => key in slugVars;

export default isSlugVar;
