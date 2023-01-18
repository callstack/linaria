import { join } from 'path';

import { transformSync } from '@babel/core';
import dedent from 'dedent';

import shakerPlugin, { hasShakerMetadata } from '../shaker-plugin';

const keep = (only: string[]) => (code: TemplateStringsArray) => {
  const filename = join(__dirname, 'source.js');
  const formattedCode = dedent(code);

  const transformed = transformSync(formattedCode, {
    babelrc: false,
    configFile: false,
    filename,
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
    !hasShakerMetadata(transformed.metadata)
  ) {
    throw new Error(`${filename} has no shaker metadata`);
  }

  return {
    code: transformed.code,
    metadata: transformed.metadata.__linariaShaker,
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
});
