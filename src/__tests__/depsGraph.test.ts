/* eslint-disable no-template-curly-in-string */

import dedent from 'dedent';
import * as babel from '@babel/core';
import buildDepsGraph from '../babel/evaluate/graphBuilder';

function _build(literal: TemplateStringsArray, ...placeholders: string[]) {
  const code = dedent(literal, ...placeholders);
  return {
    ast: babel.parseSync(code)!,
    code,
  };
}

function _buildGraph(literal: TemplateStringsArray, ...placeholders: string[]) {
  const { ast } = _build(literal, ...placeholders);
  return buildDepsGraph(ast);
}

describe('VariableDeclaration', () => {
  it('Identifier', () => {
    const graph = _buildGraph`
        const a = 42;
      `;

    const deps = graph.getDependenciesByBinding('0:a');
    expect(deps).toMatchObject([
      {
        type: 'NumericLiteral',
        value: 42,
      },
      {
        type: 'VariableDeclarator',
      },
    ]);

    expect(graph.findDependencies({ name: 'a' })).toContainEqual(deps[0]);
  });

  it('ObjectPattern', () => {
    const graph = _buildGraph`
        const { a } = { a: 42 };
        const { a: { c: b } } = { a: { b: 42 } };
      `;

    const a0Deps = graph.getDependenciesByBinding('0:a');
    expect(a0Deps).toMatchObject([
      {
        type: 'Identifier',
        name: 'a',
      },
      {
        type: 'ObjectProperty',
        key: {
          name: 'a',
        },
      },
    ]);

    const a1Deps = graph.getDependencies(a0Deps);
    expect(a1Deps).toMatchObject([
      {
        type: 'ObjectPattern',
      },
    ]);

    const a2Deps = graph.getDependencies(a1Deps);
    expect(a2Deps).toMatchObject([
      {
        type: 'ObjectExpression',
        properties: [
          {
            key: {
              name: 'a',
            },
            value: {
              value: 42,
            },
          },
        ],
      },
      {
        type: 'VariableDeclarator',
      },
    ]);

    const bDeps = graph.getDependenciesByBinding('0:b');
    expect(bDeps).toMatchObject([
      {
        type: 'Identifier',
        name: 'c',
      },
      {
        type: 'ObjectProperty',
        key: {
          name: 'c',
        },
      },
    ]);

    expect(graph.findDependencies({ value: 42 })).toHaveLength(0);
    expect(graph.findDependents({ value: 42 })).toHaveLength(2);
  });
});

describe('scopes', () => {
  it('BlockStatement', () => {
    const graph = _buildGraph`
        let a = 42;
        {
          const a = "21";
        }

        a = 21;
      `;

    const deps0 = graph.getDependenciesByBinding('0:a');
    expect(deps0).toMatchObject([
      {
        type: 'NumericLiteral',
        value: 42,
      },
      {
        type: 'VariableDeclarator',
      },
      {
        type: 'Identifier',
        start: 4,
      },
      {
        type: 'Identifier',
        start: 35,
      },
      {
        type: 'NumericLiteral',
        value: 21,
      },
      {
        type: 'AssignmentExpression',
      },
    ]);

    const deps1 = graph.getDependenciesByBinding('1:a');
    expect(deps1).toMatchObject([
      {
        type: 'StringLiteral',
        value: '21',
      },
      {
        type: 'VariableDeclarator',
      },
    ]);

    expect(graph.findDependencies({ name: 'a' })).toHaveLength(8);
  });

  it('Function', () => {
    const graph = _buildGraph`
        const a = (arg1, arg2 = 1, { a: arg3 = arg1 }) => arg1 + arg2 + arg3;
      `;

    const aDeps = graph.getDependenciesByBinding('0:a');
    expect(aDeps).toMatchObject([
      {
        type: 'ArrowFunctionExpression',
      },
      {
        type: 'VariableDeclarator',
      },
    ]);

    expect(graph.getDependenciesByBinding('1:arg1')).toHaveLength(2);
    expect(graph.getDependentsByBinding('1:arg1')).toMatchObject([
      {
        type: 'Identifier',
        name: 'arg1',
        start: 39,
      },
      {
        type: 'Identifier',
        name: 'arg3',
      },
      {
        type: 'Identifier',
        name: 'arg1',
        start: 50,
      },
      {
        type: 'BinaryExpression',
        right: {
          name: 'arg2',
        },
      },
      {
        type: 'ArrowFunctionExpression',
      },
    ]);

    expect(graph.getDependenciesByBinding('1:arg2')).toMatchObject([
      {
        type: 'NumericLiteral',
        value: 1,
      },
      {
        type: 'Identifier',
        name: 'arg2',
        start: 17,
      },
    ]);

    expect(graph.getDependenciesByBinding('1:arg3')).toMatchObject([
      {
        type: 'Identifier',
        name: 'arg1',
      },
      {
        type: 'Identifier',
        name: 'arg3',
        start: 32,
      },
    ]);
  });
});

describe('AssignmentExpression', () => {
  it('Identifier', () => {
    const graph = _buildGraph`
        let a = 42;
        a = 24;
      `;

    const deps = graph.getDependenciesByBinding('0:a');
    expect(deps).toMatchObject([
      {
        type: 'NumericLiteral',
        value: 42,
      },
      {
        type: 'VariableDeclarator',
      },
      {
        type: 'Identifier',
        name: 'a',
        start: 4,
      },
      {
        type: 'Identifier',
        name: 'a',
        start: 12,
      },
      {
        type: 'NumericLiteral',
        value: 24,
      },
      {
        type: 'AssignmentExpression',
      },
    ]);

    expect(graph.findDependents({ value: 42 })).toHaveLength(2);
    expect(graph.findDependents({ value: 24 })).toHaveLength(2);
  });

  it('MemberExpression', () => {
    const graph = _buildGraph`
        const a = {};
        a.foo.bar = 42;
      `;

    expect(graph.getDependenciesByBinding('0:a')).toMatchObject([
      {
        type: 'ObjectExpression',
        properties: [],
      },
      {
        type: 'VariableDeclarator',
      },
      {
        type: 'Identifier',
        name: 'a',
        start: 6,
      },
      {
        type: 'Identifier',
        name: 'a',
        start: 14,
      },
      {
        type: 'MemberExpression',
        property: {
          name: 'foo',
        },
      },
    ]);

    expect(graph.findDependents({ value: 42 })).toMatchObject([
      {
        type: 'AssignmentExpression',
      },
      {
        type: 'MemberExpression',
        property: {
          name: 'bar',
        },
      },
    ]);
  });
});

it('SequenceExpression', () => {
  const graph = _buildGraph`
      const color1 = 'blue';
      let local = '';
      const color2 = (true, local = color1, () => local);
    `;

  const seqDeps = graph.findDependencies({
    type: 'SequenceExpression',
  });
  expect(seqDeps).toMatchObject([
    {
      type: 'ArrowFunctionExpression',
    },
  ]);

  const fnDeps = graph.findDependencies({
    type: 'ArrowFunctionExpression',
  });
  expect(fnDeps).toMatchObject([
    {
      type: 'Identifier',
      name: 'local',
    },
  ]);

  const localDeps = graph.getDependenciesByBinding('0:local');
  expect(localDeps).toMatchObject([
    {
      type: 'StringLiteral',
      value: '',
    },
    {
      type: 'VariableDeclarator',
    },
    {
      type: 'Identifier',
      name: 'local',
      start: 27,
    },
    {
      type: 'Identifier',
      name: 'local',
      start: 61,
    },
    {
      type: 'Identifier',
      name: 'color1',
    },
    {
      type: 'AssignmentExpression',
    },
    {
      type: 'Identifier',
      name: 'local',
      start: 27,
    },
  ]);

  const bool = { type: 'BooleanLiteral' };
  expect(graph.findDependents(bool)).toHaveLength(0);
  expect(graph.findDependencies(bool)).toHaveLength(0);
});

it('MemberExpression', () => {
  const graph = _buildGraph`
    const key = 'blue';
    const obj = { blue: '#00F' };
    const blue = obj[key];
  `;

  const memberExprDeps = graph.findDependencies({
    type: 'MemberExpression',
  });

  expect(memberExprDeps).toMatchObject([
    {
      type: 'Identifier',
      name: 'obj',
    },
    {
      type: 'Identifier',
      name: 'key',
    },
  ]);
});
