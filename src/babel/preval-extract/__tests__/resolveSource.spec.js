import { types } from 'babel-core';
import resolveSource from '../resolveSource';

function runAssertions(pathFromBinding, expectedSource) {
  const source = resolveSource(types, {
    node: {
      name: 'test',
    },
    scope: {
      getBinding() {
        return pathFromBinding;
      },
    },
  });
  expect(source).toEqual(expectedSource);
}

describe('preval-extract/resolveSource', () => {
  it('throw error if there is no binding to node', () => {
    expect(() => {
      resolveSource(types, {
        node: {
          name: 'test',
        },
        scope: {
          getBinding() {
            return null;
          },
        },
        buildCodeFrameError: () => new Error('test'),
      });
    }).toThrowError();
  });

  it('should return code and loc for module node', () => {
    runAssertions(
      {
        kind: 'module',
        path: {
          parentPath: {
            getSource: () => 'source',
          },
          node: {
            loc: { start: { line: 0, column: 0 } },
          },
        },
      },
      {
        code: 'source',
        loc: { line: 0, column: 0 },
      }
    );
  });

  it('should return code and loc for variable node', () => {
    const kinds = ['const', 'let', 'var'];

    kinds.forEach(kind => {
      runAssertions(
        {
          kind,
          path: {
            getSource: () => 'source',
            isVariableDeclarator: () => false,
            node: {
              loc: { start: { line: 0, column: 0 } },
            },
          },
        },
        {
          code: `${kind} source`,
          loc: { line: 0, column: 0 },
        }
      );
    });

    runAssertions(
      {
        kind: 'const',
        path: {
          getSource: () => 'source',
          isVariableDeclarator: () => true,
          node: {
            type: 'VariableDeclarator',
            id: {
              type: 'Identifier',
              name: 'test',
            },
            init: {
              type: 'StringLiteral',
              value: 'value',
              leadingComments: [{ value: 'linaria-output' }],
            },
            loc: { start: { line: 0, column: 0 } },
          },
        },
      },
      {
        code: 'const test = /*linaria-output*/"value";',
        loc: { line: 0, column: 0 },
      }
    );

    runAssertions(
      {
        kind: 'const',
        path: {
          getSource: () => '',
          isVariableDeclarator: () => false,
          node: {
            loc: { start: { line: 0, column: 0 } },
          },
        },
      },
      null
    );
  });

  it('should return code and loc for other node', () => {
    runAssertions(
      {
        kind: 'expression',
        path: {
          getSource: () => 'source',
          node: {
            loc: { start: { line: 0, column: 0 } },
          },
        },
      },
      {
        code: 'source',
        loc: { line: 0, column: 0 },
      }
    );
  });

  it('should return null if location for node is not specified', () => {
    runAssertions(
      {
        kind: 'expression',
        path: {
          getSource: () => 'source',
          node: {
            loc: null,
          },
        },
      },
      null
    );
  });
});
