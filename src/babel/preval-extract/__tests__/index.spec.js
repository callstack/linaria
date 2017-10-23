import * as babel from 'babel-core';
import prevalExtractPlugin, {
  cssTaggedTemplateRequirementsVisitor,
  externalRequirementsVisitor,
} from '../index';
import extractStyles from '../extractStyles';
import prevalStyles from '../prevalStyles';

jest.mock('../extractStyles');
jest.mock('../prevalStyles');

describe('preval-extract/index', () => {
  describe('Program#enter visitor', () => {
    it('should set necessary flags in state', () => {
      const { visitor } = prevalExtractPlugin(babel);

      const state = {
        file: {
          opts: {
            filename: 'test.js',
          },
        },
      };

      visitor.Program.enter(
        {
          container: {
            tokens: [],
          },
        },
        state
      );

      expect(state).toEqual({
        skipFile: false,
        foundLinariaTaggedLiterals: false,
        filename: 'test.js',
        file: {
          opts: {
            filename: 'test.js',
          },
        },
      });
    });

    it('should set skipFile flag if linaria-preval comment is found', () => {
      const { visitor } = prevalExtractPlugin(babel);

      const state = {
        file: {
          opts: {
            filename: 'test.js',
          },
        },
      };

      visitor.Program.enter(
        {
          container: {
            tokens: [
              {
                type: 'CommentBlock',
                value: ' linaria-preval ',
              },
            ],
          },
        },
        state
      );

      expect(state.skipFile).toBeTruthy();
    });
  });

  describe('Program#exit visitor', () => {
    beforeEach(() => {
      extractStyles.mockClear();
    });

    it('should call extractStyles if linaria tagged template literal was found', () => {
      const { visitor } = prevalExtractPlugin(babel);

      visitor.Program.exit(
        {
          container: {
            tokens: [],
          },
        },
        {
          skipFile: false,
          foundLinariaTaggedLiterals: true,
        }
      );

      expect(extractStyles).toHaveBeenCalled();
    });

    it('should not call extractStyles there were not styles extracted', () => {
      const { visitor } = prevalExtractPlugin(babel);

      visitor.Program.exit(
        {
          container: {
            tokens: [],
          },
        },
        {
          skipFile: false,
          foundLinariaTaggedLiterals: false,
        }
      );

      expect(extractStyles).not.toHaveBeenCalled();
    });

    it('should not do anything is skipFile flag is true', () => {
      const { visitor } = prevalExtractPlugin(babel);

      visitor.Program.exit(
        {
          container: {
            tokens: [],
          },
        },
        {
          skipFile: true,
          get foundLinariaTaggedLiterals() {
            throw new Error(
              'foundLinariaTaggedLiterals should not have been called'
            );
          },
        }
      );

      expect(extractStyles).not.toHaveBeenCalled();
    });
  });

  describe('TaggedTemplateExpression', () => {
    beforeEach(() => {
      prevalStyles.mockClear();
    });

    it('should not do anything if skipFile flag is set to true', () => {
      const { visitor } = prevalExtractPlugin(babel);

      visitor.TaggedTemplateExpression(null, {
        skipFile: true,
        foundLinariaTaggedLiterals: false,
      });

      expect(prevalStyles).not.toHaveBeenCalled();
    });

    it('should not process template if checks do not pass', () => {
      const { visitor } = prevalExtractPlugin(babel);

      visitor.TaggedTemplateExpression(
        {
          node: {
            type: 'TaggedTemplateExpression',
            tag: {
              type: 'Identifier',
              name: 'styles',
            },
          },
        },
        {
          skipFile: false,
          foundLinariaTaggedLiterals: false,
        }
      );

      expect(prevalStyles).not.toHaveBeenCalled();

      expect(() => {
        visitor.TaggedTemplateExpression(
          {
            node: {
              type: 'TaggedTemplateExpression',
              tag: {
                type: 'Identifier',
                name: 'css',
              },
            },
            parentPath: {
              isVariableDeclarator: () => false,
            },
            findParent: () => null,
            buildCodeFrameError: text => new Error(text),
          },
          {
            skipFile: false,
            foundLinariaTaggedLiterals: false,
          }
        );
      }).toThrowErrorMatchingSnapshot();
    });

    it('should collect requirements and call prevalStyles', () => {
      const { visitor } = prevalExtractPlugin(babel);

      visitor.TaggedTemplateExpression(
        {
          node: {
            type: 'TaggedTemplateExpression',
            tag: {
              type: 'Identifier',
              name: 'css',
            },
          },
          parentPath: {
            isVariableDeclarator: () => true,
          },
          parent: {
            id: {
              name: 'test',
            },
          },
          traverse: () => {},
          findParent: () => null,
          replaceWith: () => {},
          addComment: () => {},
        },
        {
          skipFile: false,
          foundLinariaTaggedLiterals: false,
        }
      );

      expect(prevalStyles).toHaveBeenCalled();
      expect(prevalStyles.mock.calls[0][1]).toBe('test');

      const propertyParent = {
        node: {
          type: 'ObjectProperty',
          key: {
            type: 'Identifier',
            name: 'foo',
          },
        },
        isObjectProperty: () => true,
        isJSXOpeningElement: () => false,
      };

      visitor.TaggedTemplateExpression(
        {
          node: {
            type: 'TaggedTemplateExpression',
            tag: {
              type: 'Identifier',
              name: 'css',
            },
          },
          parentPath: {
            isVariableDeclarator: () => false,
          },
          traverse: () => {},
          findParent: check => (check(propertyParent) ? propertyParent : null),
          replaceWith: () => {},
          addComment: () => {},
        },
        {
          skipFile: false,
          foundLinariaTaggedLiterals: false,
        }
      );

      expect(prevalStyles).toHaveBeenCalled();
      expect(prevalStyles.mock.calls[1][1]).toBe('foo');

      const jsxParent = {
        node: {
          type: 'JSXOpeningElement',
          name: {
            type: 'JSXIdentifier',
            name: 'article',
          },
        },
        isObjectProperty: () => false,
        isJSXOpeningElement: () => true,
      };

      visitor.TaggedTemplateExpression(
        {
          node: {
            type: 'TaggedTemplateExpression',
            tag: {
              type: 'Identifier',
              name: 'css',
            },
          },
          parentPath: {
            isVariableDeclarator: () => false,
          },
          traverse: () => {},
          findParent: check => (check(jsxParent) ? jsxParent : null),
          replaceWith: () => {},
          addComment: () => {},
        },
        {
          skipFile: false,
          foundLinariaTaggedLiterals: false,
        }
      );

      expect(prevalStyles).toHaveBeenCalled();
      expect(prevalStyles.mock.calls[2][1]).toBe('article');
    });
  });

  [
    {
      id: 'cssTaggedTemplateRequirementsVisitor',
      visitor: cssTaggedTemplateRequirementsVisitor,
    },
    {
      id: 'externalRequirementsVisitor',
      visitor: externalRequirementsVisitor,
    },
  ].forEach(({ id, visitor }) => {
    describe(id, () => {
      it('should not do anything if path is not referenced or is excluded', () => {
        const self = {};
        visitor.Identifier.call(self, {
          isReferenced: () => false,
        });

        visitor.Identifier.call(self, {
          isReferenced: () => true,
          node: {
            name: 'test',
          },
          scope: {
            getBinding: () => ({ kind: 'param' }),
          },
        });

        expect(self).toEqual({});
      });

      it('should not add source to requirements if it is null', () => {
        const self = { requirements: [] };
        visitor.Identifier.call(self, {
          isReferenced: () => true,
          node: {
            name: 'test',
          },
          scope: {
            getBinding: () => ({
              kind: 'expression',
              path: {
                getSource: () => null,
                node: {
                  loc: null,
                },
              },
            }),
          },
        });

        expect(self).toEqual({ requirements: [] });
      });

      it('should not add source to requirements if it was already added', () => {
        const requirements = [{ code: 'source', loc: { line: 0, column: 0 } }];
        const self = {
          requirements: [...requirements],
        };
        visitor.Identifier.call(self, {
          isReferenced: () => true,
          node: {
            name: 'test',
          },
          scope: {
            getBinding: () => ({
              kind: 'expression',
              path: {
                getSource: () => 'source',
                node: {
                  loc: { line: 0, column: 0 },
                },
              },
            }),
          },
        });

        expect(self).toEqual({ requirements });
      });

      it('should add source to requirements', () => {
        const self = { requirements: [], addBeforeIndex: 0 };
        visitor.Identifier.call(self, {
          isReferenced: () => true,
          node: {
            name: 'test',
          },
          scope: {
            getBinding: () => ({
              kind: 'expression',
              path: {
                getSource: () => 'source',
                isImportDefaultSpecifier: () => true,
                node: {
                  loc: { start: { line: 0, column: 0 } },
                },
              },
            }),
          },
        });

        expect(self).toEqual({
          addBeforeIndex: 0,
          requirements: [{ code: 'source', loc: { line: 0, column: 0 } }],
        });
      });

      it('should add source to requirements and traverse with external visitor', () => {
        const traverse = jest.fn();
        const self = { requirements: [], addBeforeIndex: 0 };
        visitor.Identifier.call(self, {
          isReferenced: () => true,
          node: {
            name: 'test',
          },
          scope: {
            getBinding: () => ({
              kind: 'expression',
              path: {
                getSource: () => 'source',
                isImportDefaultSpecifier: () => false,
                isImportSpecifier: () => false,
                node: {
                  loc: { start: { line: 0, column: 0 } },
                },
                traverse,
              },
            }),
          },
        });

        expect(self).toEqual({
          addBeforeIndex: 0,
          requirements: [{ code: 'source', loc: { line: 0, column: 0 } }],
        });
        expect(traverse).toHaveBeenCalled();
      });
    });
  });
});
