jest.mock('../importModule');

import {
  resolveValueFromPath,
  resolveBaseObjectIdentifier,
  resolvePropertyPath,
  resolveExpressions,
} from '../resolvers';
import importModule from '../importModule';
import * as babel from 'babel-core';

const types = babel.types;
function getAstFromCode(code) {
  return babel.transform(code).ast;
}

describe('babel/resolvers', () => {
  describe('resolveValueFromPath', () => {
    it('should return value resolved from given object using given path', () => {
      expect(
        resolveValueFromPath({ prop1: { prop2: { prop3: 'value' } } }, [
          'prop1',
          'prop2',
          'prop3',
        ])
      ).toEqual('value');
    });
  });

  describe('resolveBaseObjectIdentifier', () => {
    it('should resolve base object id', () => {
      const ast = getAstFromCode('object.prop1.prop2.prop3');
      expect(
        resolveBaseObjectIdentifier(ast.program.body[0].expression, types).name
      ).toEqual('object');
    });
  });

  describe('resolvePropertyPath', () => {
    it('should resolve path to a nested property', () => {
      const ast = getAstFromCode('object.prop1.prop2.prop3');
      expect(
        resolvePropertyPath(ast.program.body[0].expression, types)
      ).toEqual(['prop1', 'prop2', 'prop3']);
    });
  });

  describe('resolveExpressions', () => {
    it('should resolve expressions in tagged template literal', () => {
      importModule.mockImplementation(() => ({ prop: 'prop' }));
      const originalExpr = getAstFromCode('tag`prop: ${vars.prop}`').program
        .body[0].expression;
      const tmplExpr = resolveExpressions(originalExpr, {}, types);
      expect(tmplExpr.quasi.expressions.length).toBe(0);
      expect(tmplExpr.quasi.quasis.length).toBe(3);
      expect(tmplExpr.quasi.quasis[1].value.cooked).toEqual('prop');
    });
  });
});
