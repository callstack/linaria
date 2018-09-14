import { types } from 'babel-core';
import {
  isLinariaTaggedTemplate,
  shouldTraverseExternalIds,
  isExcluded,
} from '../validators';

describe('preval-extract/validators', () => {
  describe('isLinariaTaggedTemplate', () => {
    it('should return true if path is css tagged template', () => {
      expect(
        isLinariaTaggedTemplate(types, {
          type: 'Expression',
          node: {
            tag: {
              type: 'Identifier',
              name: 'css',
            },
          },
        })
      ).toBeTruthy();
    });

    it('should return true if path is css.named tagged template', () => {
      expect(
        isLinariaTaggedTemplate(types, {
          type: 'Expression',
          node: {
            tag: {
              type: 'CallExpression',
              arguments: [
                {
                  type: 'StringLiteral',
                  value: 'className',
                },
              ],
              callee: {
                type: 'MemberExpression',
                object: {
                  type: 'Identifier',
                  name: 'css',
                },
                property: {
                  type: 'Identifier',
                  name: 'named',
                },
              },
            },
          },
        })
      ).toBeTruthy();
    });

    it('should return false if path is neither css nor css.named tagged template', () => {
      expect(
        isLinariaTaggedTemplate(types, {
          type: 'Expression',
          node: {
            tag: {
              type: 'Identifier',
              name: 'named',
            },
          },
        })
      ).toBeFalsy();
    });

    it('throw error if css.named is not called', () => {
      expect(() => {
        isLinariaTaggedTemplate(types, {
          type: 'Expression',
          node: {
            tag: {
              type: 'CallExpression',
              arguments: [],
              callee: {
                type: 'MemberExpression',
                object: {
                  type: 'Identifier',
                  name: 'css',
                },
                property: {
                  type: 'Identifier',
                  name: 'named',
                },
              },
            },
          },
        });
      }).toThrowError();

      expect(() => {
        isLinariaTaggedTemplate(types, {
          type: 'Expression',
          node: {
            tag: {
              type: 'MemberExpression',
              object: {
                type: 'Identifier',
                name: 'css',
              },
              property: {
                type: 'Identifier',
                name: 'named',
              },
            },
          },
        });
      }).toThrowError();
    });
  });

  describe('shouldTraverseExternalIds', () => {
    it('should return false if path is a import specifier', () => {
      expect(
        shouldTraverseExternalIds({ isImportDefaultSpecifier: () => true })
      ).toBeFalsy();
      expect(
        shouldTraverseExternalIds({
          isImportDefaultSpecifier: () => false,
          isImportSpecifier: () => true,
        })
      ).toBeFalsy();
    });

    it('should return true if path is not an import specifier', () => {
      expect(
        shouldTraverseExternalIds({
          isImportDefaultSpecifier: () => false,
          isImportSpecifier: () => false,
        })
      ).toBeTruthy();
    });
  });

  describe('isExcluded', () => {
    it('should return false if path has non-param binding', () => {
      expect(
        isExcluded({
          node: { name: 'test' },
          scope: {
            getBinding() {
              return {
                kind: 'module',
              };
            },
          },
        })
      ).toBeFalsy();
    });

    it('should return true if path has param binding', () => {
      expect(
        isExcluded({
          node: { name: 'test' },
          scope: {
            getBinding() {
              return {
                kind: 'param',
              };
            },
          },
        })
      ).toBeTruthy();
    });
  });
});
