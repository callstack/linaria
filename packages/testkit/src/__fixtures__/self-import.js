import { constant as importedConstant } from './self-import';

export const constant = 42;
export const stringConstant = importedConstant.toString(16);
