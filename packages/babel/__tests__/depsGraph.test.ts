/* eslint-disable no-template-curly-in-string */

import dedent from 'dedent';
import * as babel from '@babel/core';
import buildDepsGraph from '../../shaker/src/graphBuilder';

function _build(literal: TemplateStringsArray, ...placeholders: string[]) {
  const code = dedent(literal, ...placeholders);
  return {
    ast: babel.parseSync(code, { filename: 'source.js' })!,
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
        type: 'VariableDeclarator',
      },
      {
        type: 'NumericLiteral',
        value: 42,
      },
    ]);

    expect(graph.findDependencies({ name: 'a' })).toContainEqual(deps[0]);
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
        type: 'VariableDeclarator',
      },
      {
        type: 'NumericLiteral',
        value: 42,
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
        type: 'AssignmentExpression',
      },
      {
        type: 'NumericLiteral',
        value: 21,
      },
    ]);

    const deps1 = graph.getDependenciesByBinding('1:a');
    expect(deps1).toMatchObject([
      {
        type: 'VariableDeclarator',
      },
      {
        type: 'StringLiteral',
        value: '21',
      },
    ]);

    expect(graph.findDependencies({ name: 'a' })).toHaveLength(8);
  });

  it('Function', () => {
    const graph = _buildGraph`
        const a = (arg1, arg2, arg3) => arg1 + arg2 + arg3;
      `;

    const aDeps = graph.getDependenciesByBinding('0:a');
    expect(aDeps).toMatchObject([
      {
        type: 'VariableDeclarator',
      },
      {
        type: 'ArrowFunctionExpression',
      },
    ]);

    expect(graph.getDependenciesByBinding('1:arg1')).toHaveLength(3);
    expect(graph.getDependentsByBinding('1:arg1')).toMatchObject([
      {
        // arg1 in the binary expression
        type: 'Identifier',
        name: 'arg1',
        start: 32,
      },
      {
        // arg1 + arg2
        type: 'BinaryExpression',
        right: {
          name: 'arg2',
        },
      },
      {
        // (arg1 + arg2) + arg3, because of it is the whole function body
        type: 'BinaryExpression',
        right: {
          name: 'arg3',
        },
      },
    ]);

    expect(graph.getDependenciesByBinding('1:arg2')).toMatchObject([
      {
        type: 'ArrowFunctionExpression',
      },
      {
        type: 'Identifier',
        name: 'arg2',
        start: 17,
      },
      {
        type: 'BinaryExpression',
        start: 32,
      },
    ]);

    expect(graph.getDependenciesByBinding('1:arg3')).toMatchObject([
      {
        type: 'ArrowFunctionExpression',
      },
      {
        type: 'Identifier',
        name: 'arg3',
        start: 23,
      },
      {
        type: 'BinaryExpression',
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
        type: 'VariableDeclarator',
      },
      {
        type: 'NumericLiteral',
        value: 42,
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
        type: 'AssignmentExpression',
      },
      {
        type: 'NumericLiteral',
        value: 24,
      },
    ]);

    expect(graph.findDependents({ value: 42 })).toHaveLength(1);
    expect(graph.findDependents({ value: 24 })).toHaveLength(1);
  });

  it('MemberExpression', () => {
    const graph = _buildGraph`
        const a = {};
        a.foo.bar = 42;
      `;

    expect(graph.getDependenciesByBinding('0:a')).toMatchObject([
      {
        type: 'VariableDeclarator',
      },
      {
        type: 'ObjectExpression',
        properties: [],
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
    {
      id: {
        name: 'color2',
      },
      type: 'VariableDeclarator',
    },
  ]);

  const fnDeps = graph.findDependencies({
    type: 'ArrowFunctionExpression',
  });
  expect(fnDeps).toMatchObject([
    {
      body: {
        name: 'local',
        type: 'Identifier',
      },

      type: 'ArrowFunctionExpression',
    },
    {
      name: 'local',
      type: 'Identifier',
    },
    {
      type: 'SequenceExpression',
    },
  ]);

  const localDeps = graph.getDependenciesByBinding('0:local');
  expect(localDeps).toMatchObject([
    {
      type: 'VariableDeclarator',
    },
    {
      type: 'StringLiteral',
      value: '',
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
      type: 'AssignmentExpression',
    },
    {
      type: 'Identifier',
      name: 'color1',
    },
    {
      type: 'Identifier',
      name: 'local',
      start: 27,
    },
    {
      type: 'ArrowFunctionExpression',
    },
  ]);

  const bool = { type: 'BooleanLiteral' };
  expect(graph.findDependents(bool)).toHaveLength(0);
  expect(graph.findDependencies(bool)).toHaveLength(1);
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
    {
      type: 'VariableDeclarator',
      id: {
        name: 'blue',
      },
    },
  ]);
});
