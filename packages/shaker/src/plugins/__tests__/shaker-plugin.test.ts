import { join } from 'path';

import type { PluginItem } from '@babel/core';
import { transformSync } from '@babel/core';
import dedent from 'dedent';

import { hasEvaluatorMetadata } from '@linaria/utils';

import shakerPlugin from '../shaker-plugin';

type Extension = 'js' | 'ts' | 'jsx' | 'tsx';

const getPresets = (extension: Extension) => {
  const presets: PluginItem[] = [];
  if (extension === 'ts' || extension === 'tsx') {
    presets.push(require.resolve('@babel/preset-typescript'));
  }

  if (extension === 'jsx' || extension === 'tsx') {
    presets.push(require.resolve('@babel/preset-react'));
  }

  return presets;
};

const keep =
  (only: string[], extension: Extension = 'js') =>
  (code: TemplateStringsArray) => {
    const presets = getPresets(extension);
    const filename = join(__dirname, `source.${extension}`);
    const formattedCode = dedent(code);

    const transformed = transformSync(formattedCode, {
      babelrc: false,
      configFile: false,
      filename,
      presets,
      plugins: [
        [
          shakerPlugin,
          {
            onlyExports: only,
          },
        ],
      ],
    });

    if (
      !transformed ||
      !transformed.code ||
      !hasEvaluatorMetadata(transformed.metadata)
    ) {
      throw new Error(`${filename} has no shaker metadata`);
    }

    return {
      code: transformed.code,
      metadata: transformed.metadata.linariaEvaluator,
    };
  };

describe('shaker', () => {
  it('should remove unused export', () => {
    const { code, metadata } = keep(['a'])`
      export const a = 1;
      export const b = 2;
    `;

    expect(code).toMatchSnapshot();
    expect(metadata.imports.size).toBe(0);
  });

  it('should remove related code', () => {
    const { code, metadata } = keep(['a'])`
      const a = 1;
      const b = 2;
      export { a, b };
    `;

    expect(code).toMatchSnapshot();
    expect(metadata.imports.size).toBe(0);
  });

  it('should process array patterns', () => {
    const { code, metadata } = keep(['c'])`
      const [a, b, c] = array;
      const [,,, d, e] = array;

      export { a, b, c, d, e};
    `;

    expect(code).toMatchSnapshot();
    expect(metadata.imports.size).toBe(0);
  });

  it('should process object patterns', () => {
    const { code, metadata } = keep(['b1'])`
      const { a: a1, b: b1, c: c1 } = obj;
      const { d: d1, e: e1 } = obj;

      export { a1, b1, c1, d1, e1 };
    `;

    expect(code).toMatchSnapshot();
    expect(metadata.imports.size).toBe(0);
  });

  it('should process transpiled enums', () => {
    const { code, metadata } = keep(['defaultValue'])`
      exports.Kind = void 0;

      var Kind;
      (function (Kind) {
        Kind["DEFAULT"] = "default";
        Kind["TRANSPARENT"] = "transparent";
        Kind["RED"] = "red";
        Kind["BLACK"] = "black";
      })(Kind = exports.Kind || (exports.Kind = {}));

      export const defaultValue = Kind.DEFAULT;
    `;

    expect(code).toMatchSnapshot();
    expect(metadata.imports.size).toBe(0);
  });

  it('should keep referenced exports', () => {
    const { code, metadata } = keep(['defaultValue'])`
      exports.foo = 10;

      exports.defaultValue = Math.random() * exports.foo;
    `;

    expect(code).toMatchSnapshot();
    expect(metadata.imports.size).toBe(0);
  });

  it('should throw out unused referenced exports', () => {
    const { code, metadata } = keep(['defaultValue'])`
      exports.foo = 10;

      exports.bar = Math.random() * exports.foo;

      exports.defaultValue = 20;
    `;

    expect(code).toMatchSnapshot();
    expect(metadata.imports.size).toBe(0);
  });

  it('should remove all references of `a`', () => {
    const { code, metadata } = keep(['b'])`
      let a = 1;

      a = 2;

      exports.a = a;
      exports.b = 10;
    `;

    expect(code).toMatchSnapshot();
    expect(metadata.imports.size).toBe(0);
  });

  it('should respect implicit references', () => {
    const { code, metadata } = keep(['a'])`
      let _a;
      exports.a = _a = {};
      exports.b = _a;
    `;

    expect(code).toMatchSnapshot();
    expect(metadata.imports.size).toBe(0);
  });

  it('should keep assigment even if export is marked for removing', () => {
    const { code, metadata } = keep(['b'])`
      let _a;
      exports.a = _a = {};
      exports.b = _a;
    `;

    expect(code).toMatchSnapshot();
    expect(metadata.imports.size).toBe(0);
  });

  it('should process identifiers in void expressions as references', () => {
    const { code, metadata } = keep(['b'])`
      let _;

      const a = void _;

      function b(b) {
        void _;
      }

      exports.a = a;
      exports.b = b;
    `;

    expect(code).toMatchSnapshot();
    expect(metadata.imports.size).toBe(0);
  });

  it('should delete import', () => {
    const { code, metadata } = keep(['Alive'])`
      import { A, B } from "ABC";
      const AB = {
        A,
        B,
      };

      export const Alive = "";

      export default AB;
    `;

    expect(code).toMatchSnapshot();
    expect(metadata.imports.size).toBe(0);
  });

  it('should handle object patterns in exports', () => {
    const { code } = keep(['Alive'])`
      import foo from "foo";

      export const { Alive, Dead } = foo();
    `;

    expect(code).toMatchInlineSnapshot(`
      "import foo from \\"foo\\";
      export const {
        Alive,
        Dead
      } = foo();"
    `);
  });

  it('avoids deleting non-default exports when importing default export of a module without an __esModule: true property', () => {
    /* without workaround, this will be transformed by shaker to:
      const n = require('n');
      const defaultExports = {
        createContext: n.createContext
      };
      exports.default = defaultExports;

      i.e, exports.createContext is deleted
    */
    const { code } = keep(['default'])`
    const n = require('n');
    const defaultExports = { createContext: n.createContext }
    Object.defineProperty(exports, "createContext", {
      enumerable: !0,
      get: function() {
          return n.createContext
      }
    })
    exports.default = defaultExports;
    `;

    /*
      this breaks babel's interopRequireDefault
      without shaker, interopRequireDefault(<the test module>)
      returns: {
        default: {
          default: { createContext: ... }
          createContext: ...
        }
      }
      The double-default is because the module does not define
      __esModule: true, so interopRequireDefault assumes that it needs to wrap the exports in { default: ... }, so that subsequent code can access createContext via `<test module>.default.createContext`.

      If shaker treats the createExport named export as unused (since it's not in onlyExports), it will delete it. interopRequireDefault(<shaker-processed test module>)
      returns: {
        default: {
          default: { createContext: ... }
        }
      }

      And `<test module>.default.createContext` will be undefined.

      Therefore, we assert that createContext is not deleted in this case.
    */
    expect(code).toMatchInlineSnapshot(`
      "const n = require('n');
      const defaultExports = {
        createContext: n.createContext
      };
      Object.defineProperty(exports, \\"createContext\\", {
        enumerable: !0,
        get: function () {
          return n.createContext;
        }
      });
      exports.default = defaultExports;"
    `);
  });

  it('deletes non-default exports when importing default export of a module with an __esModule: true property', () => {
    /* without workaround, this will be transformed by shaker to:
      const n = require('n');
      const defaultExports = {
        createContext: n.createContext
      };
      exports.default = defaultExports;

      i.e, exports.createContext is deleted
    */
    const { code } = keep(['default'])`
    const n = require('n');
    const defaultExports = { createContext: n.createContext }
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "createContext", {
      enumerable: !0,
      get: function() {
          return n.createContext
      }
    })
    exports.default = defaultExports;
    `;

    expect(code).toMatchInlineSnapshot(`
      "const n = require('n');
      const defaultExports = {
        createContext: n.createContext
      };
      Object.defineProperty(exports, \\"__esModule\\", {
        value: true
      });
      Object.defineProperty(exports, \\"createContext\\", {
        enumerable: !0,
        get: function () {}
      });
      exports.default = defaultExports;"
    `);
  });

  it('should remove asset imports', () => {
    const { code, metadata } = keep(['a'])`
      import './asset.css';

      export const a = 1;
    `;

    expect(code).toMatchSnapshot();
    expect(metadata.imports.size).toBe(0);
  });

  it('should keep side-effects from modules', () => {
    const { code, metadata } = keep(['a'])`
      import 'regenerator-runtime/runtime.js';

      export const a = 1;
    `;

    expect(code).toMatchSnapshot();
    expect(metadata.imports.size).toBe(1);
  });

  it('should keep only side-effects', () => {
    const { code, metadata } = keep(['side-effect'])`
      import 'regenerator-runtime/runtime.js';

      export const a = 1;
    `;

    expect(code).toMatchSnapshot();
    expect(metadata.imports.size).toBe(1);
  });

  it('should handle __importDefault', () => {
    const { code, metadata } = keep(['Input'])`
      var __importDefault =
        (this && this.__importDefault) ||
        function (mod) {
          return mod && mod.__esModule ? mod : { default: mod };
        };
      Object.defineProperty(exports, '__esModule', { value: true });

      var Input_1 = require('./Input');
      Object.defineProperty(exports, 'Input', {
        enumerable: true,
        get: function () {
          return __importDefault(Input_1).default;
        },
      });
    `;

    expect(code).toMatchSnapshot();
    expect(metadata.imports.size).toBe(1);
    expect(metadata.imports.get('./Input')).toEqual(['default']);
  });

  it('should shake if __linariaPreval required but not exported', () => {
    const { code, metadata } = keep(['__linariaPreval', 'Input'])`
      import 'regenerator-runtime/runtime.js';

      export { Button } from "./Button";
      export { Input } from "./Input";
    `;

    expect(code).toMatchSnapshot();
    expect(metadata.imports.size).toBe(2);
    expect([...metadata.imports.keys()]).toEqual([
      'regenerator-runtime/runtime.js',
      './Input',
    ]);
  });

  it('should keep setBatch', () => {
    // A real-world example from react-redux
    const { code, metadata } = keep(['setBatch'])`
      function defaultNoopBatch(callback) {
        callback();
      }

      var batch = defaultNoopBatch;

      export var setBatch = function setBatch(newBatch) {
        return (batch = newBatch);
      };

      export var getBatch = function getBatch() {
        return batch;
      };
    `;

    expect(code).toMatchSnapshot();
    expect(metadata.imports.size).toBe(0);
  });

  it('should process constant violations inside binding paths', () => {
    // Function `a` should be removed because it's only used in removed function `b`
    const { code, metadata } = keep(['c'])`
      function a(flag) { return (a = function(flag) { flag ? 1 : 2 }) }
      export function b() { return a(1) }
      export function c() {};
    `;

    expect(code).toMatchSnapshot();
    expect(metadata.imports.size).toBe(0);
  });
});
