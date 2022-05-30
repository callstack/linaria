import path from 'path';
import { run } from '@linaria/babel-preset/__utils__/strategy-tester';
import dedent from 'dedent';
import type { TransformOptions } from '@babel/core';
import shake from '../src';

function getFileName() {
  return path.resolve(__dirname, '../../babel/__fixtures__/test.js');
}

function _shake(opts?: TransformOptions, only: string[] = ['__linariaPreval']) {
  return (
    literal: TemplateStringsArray,
    ...placeholders: string[]
  ): [string, Map<string, string[]>] => {
    const code = dedent(literal, ...placeholders);
    const [shaken, deps] = shake(
      getFileName(),
      {
        babelOptions: opts || {},
        displayName: true,
        evaluate: true,
        rules: [
          {
            action: require('../src').default,
          },
          {
            test: /\/node_modules\//,
            action: 'ignore',
          },
        ],
      },
      code,
      only
    );

    return [shaken, deps!];
  };
}

it('removes all', () => {
  const [shaken] = _shake()`
    const { whiteColor: color, anotherColor } = require('…');
    const a = color || anotherColor;
    color.green = '#0f0';

    exports.__linariaPreval = [];
  `;

  expect(shaken).toMatchSnapshot();
});

it('keeps only code which is related to `color`', () => {
  const [shaken] = _shake()`
    const { whiteColor: color, anotherColor } = require('…');
    const wrap = '';
    const a = color || anotherColor;
    color.green = '#0f0';
    module.exports = { color, anotherColor };
    exports.__linariaPreval = [color];
  `;

  expect(shaken).toMatchSnapshot();
});

it('keeps only code which is related to `anotherColor`', () => {
  const [shaken] = _shake()`
    const { whiteColor: color, anotherColor } = require('…');
    const a = color || anotherColor;
    color.green = '#0f0';
    exports.__linariaPreval = [anotherColor];
  `;

  expect(shaken).toMatchSnapshot();
});

it('keeps only code which is related to `a`', () => {
  const [shaken] = _shake()`
    const { whiteColor: color, anotherColor } = require('…');
    const a = color || anotherColor;
    color.green = '#0f0';
    exports.__linariaPreval = [a];
  `;

  expect(shaken).toMatchSnapshot();
});

it('shakes imports', () => {
  const [shaken] = _shake()`
    import { unrelatedImport } from '…';
    import { whiteColor as color, anotherColor } from '…';
    import defaultColor from '…';
    import anotherDefaultColor from '…';
    import '…';
    require('…');
    export default color;
    exports.__linariaPreval = [color, defaultColor];
  `;

  expect(shaken).toMatchSnapshot();
});

it('should keep member expression key', () => {
  const [shaken] = _shake()`
    const key = 'blue';
    const obj = { blue: '#00F' };
    const blue = obj[key];
    exports.__linariaPreval = [blue];
  `;

  expect(shaken).toMatchSnapshot();
});

it('shakes exports', () => {
  const [shaken] = _shake()`
    import { whiteColor as color, anotherColor } from '…';
    export const a = color;
    export { redColor } from "…";
    export { anotherColor };
    exports.__linariaPreval = [a];
  `;

  expect(shaken).toMatchSnapshot();
});

it('shakes es5 exports', () => {
  const [shaken] = _shake(undefined, ['redColor', 'greenColor', 'yellowColor'])`
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.redColor = 'red';
    exports['yellowColor'] = 'yellow';
    exports['pinkColor'] = 'pink';
    Object.defineProperty(exports, "blueColor", {
      enumerable: true,
      get: function get() {
        return 'blue';
      }
    });
    Object.defineProperty(exports, "greenColor", {
      enumerable: true,
      get: function get() {
        return 'green';
      }
    });
  `;

  expect(shaken).toMatchSnapshot();
});

// TODO: this test will be disabled until the shaker is fully implemented
it.skip('should throw away any side effects', () => {
  const [shaken] = _shake()`
    const objects = { key: { fontSize: 12 } };
    const foo = (k) => {
      const obj = objects[k];
      console.log('side effect');
      return obj;
    };
    exports.__linariaPreval = [foo];
  `;

  expect(shaken).toMatchSnapshot();
});

it('keeps objects as is', () => {
  const [shaken] = _shake()`
    const fill1 = (top = 0, left = 0, right = 0, bottom = 0) => ({
      position: 'absolute',
      top,
      right,
      bottom,
      left,
    });

    const fill2 = (top = 0, left = 0, right = 0, bottom = 0) => {
      return {
        position: 'absolute',
        top,
        right,
        bottom,
        left,
      };
    };

    exports.__linariaPreval = [fill1, fill2];
  `;

  expect(shaken).toMatchSnapshot();
});

it('shakes sequence expression', () => {
  const [shaken] = _shake()`
    import { external } from '…';
    const color1 = (external, () => 'blue');
    let local = '';
    const color2 = (local = color1(), () => local);
    exports.__linariaPreval = [color2];
  `;

  expect(shaken).toMatchSnapshot();
});

it('shakes assignment patterns', () => {
  const [shaken] = _shake()`
    const [identifier = 1] = [2];
    const [{...object} = {}] = [{ a: 1, b: 2 }];
    const [[...array] = []] = [[1,2,3,4]];
    const obj = { member: null };
    ([obj.member = 42] = [1]);
    exports.__linariaPreval = [identifier, object, array, obj];
  `;

  expect(shaken).toMatchSnapshot();
});

it('shakes for-in statements', () => {
  const [shaken] = _shake()`
    const obj1 = { a: 1, b: 2 };
    const obj2 = {};
    for (const key in obj1) {
      obj2[key] = obj1[key];
    }
    exports.__linariaPreval = [obj2];
  `;

  expect(shaken).toMatchSnapshot();
});

it('keeps reused exports', () => {
  const [shaken] = _shake()`
    const bar = function() {
      return 'hello world';
    };
    exports.bar = bar;

    const foo = exports.bar();
    exports.__linariaPreval = [foo];
  `;

  expect(shaken).toMatchSnapshot();
});

describe('shaker', () => {
  run(__dirname, require('../src').default, (transpile) => {
    it('should work with wildcard imports', async () => {
      const { code, metadata } = await transpile(
        dedent`
      import { css } from "@linaria/core";
      import * as mod from "@linaria/babel-preset/__fixtures__/complex-component";

      const color = mod["whiteColor"];

      export const square = css\`
        ${'${mod.Title}'} {
          color: ${'${color}'};
        }
      \`;
    `
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('assigning to exports', async () => {
      const { code, metadata } = await transpile(
        dedent`
      import { css } from "@linaria/core";
      import { Padding } from "../__fixtures__/assignToExport";

      export const square = css\`
        div {
          padding: ${'${Padding}'}px;
        }
      \`;
    `
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('exporting objects', async () => {
      const { code, metadata } = await transpile(
        dedent`
      import { css } from "@linaria/core";
      import object from "../__fixtures__/objectExport";

      export const square = css\`
        div {
          margin: ${'${object.margin}'}px;
        }
      \`;
    `
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('exporting objects with computed keys', async () => {
      const { code, metadata } = await transpile(
        dedent`
      import { css } from "@linaria/core";
      import { object } from "../__fixtures__/computedKeys";

      export const square = css\`
        div {
          color: ${'${object.blue}'};
        }
      \`;
    `
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('exporting sequence expressions', async () => {
      const { code, metadata } = await transpile(
        dedent`
      import { css } from "@linaria/core";
      import number from "../__fixtures__/sequenceExport";

      export const square = css\`
        div {
          height: ${'${number}'}px;
        }
      \`;
    `
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('should work with wildcard reexports', async () => {
      const { code, metadata } = await transpile(
        dedent`
      import { css } from "@linaria/core";
      import { foo1 } from "../__fixtures__/reexports";

      export const square = css\`
        color: ${'${foo1}'};
      \`;
    `
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('should interpolate imported components', async () => {
      const { code, metadata } = await transpile(
        dedent`
      import { css } from "@linaria/core";
      import { Title } from "@linaria/babel-preset/__fixtures__/complex-component";

      export const square = css\`
        ${'${Title}'} {
          color: red;
        }
      \`;
    `
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('should interpolate imported variables', async () => {
      const { code, metadata } = await transpile(
        dedent`
      import { css } from "@linaria/core";
      import { whiteColor } from "@linaria/babel-preset/__fixtures__/complex-component";

      export const square = css\`
        color: ${'${whiteColor}'}
      \`;
    `
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('evaluates typescript enums', async () => {
      const { code, metadata } = await transpile(
        dedent`
      import { styled } from '@linaria/react';

      enum Colors {
        BLUE = '#27509A'
      }

      export const Title = styled.h1\`
        color: ${'${Colors.BLUE}'};
      \`;
      `,
        (config) => ({
          ...config,
          presets: ['@babel/preset-typescript', ...(config.presets ?? [])],
          filename: 'source.ts',
        })
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });

    it('evaluates chain of reexports', async () => {
      const { code, metadata } = await transpile(
        dedent`
      import { styled } from '@linaria/react';
      import { fooStyles } from "@linaria/babel-preset/__fixtures__/reexports";

      const value = fooStyles.foo;

      export const H1 = styled.h1\`
        color: ${'${value}'};
      \`
      `
      );

      expect(code).toMatchSnapshot();
      expect(metadata).toMatchSnapshot();
    });
  });
});
