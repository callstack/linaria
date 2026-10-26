import dedent from 'dedent';
import postcss from 'postcss';
import * as postcssPlugin from 'prettier/plugins/postcss';
import { format } from 'prettier/standalone';

import collect from '../src/collect';

// prettier 3 formats asynchronously; the standalone build with an explicit plugin also runs without
// --experimental-vm-modules
const prettyPrint = (src: string) =>
  format(src, { parser: 'scss', plugins: [postcssPlugin] });

const testCollect = (html: string, css: string) => {
  const { critical, other } = collect(html, css);
  test('critical', async () =>
    expect(await prettyPrint(critical)).toMatchSnapshot());
  test('other', async () => expect(await prettyPrint(other)).toMatchSnapshot());
};

const html = dedent`
  <div class="linaria lily">
    <span class="lotus"></div>
  </div>
`;

describe('collects complex css', () => {
  const css = dedent`
    .lotus {
      vertical-align: top;
    }

    @media (max-width: 1200px) {
      .lotus {
        vertical-align: bottom;
      }
    }

    @supports (object-fit: cover) {
      .unrelated-nested {
        float: left;
        animation: custom-animation;
      }

      .unrelated-nested2 {
        float: left;
      }
    }

    @supports (object-fit: contain) {
      .lotus {
        object-fit: contain;
      }

      .linaria::before,
      .linaria::after {
        content: '';
        object-fit: contain;
      }
    }

    @keyframes custom-animation {
      0% { opacity: 0 }
      50% { opacity: 0 }
      100% { opacity: 1 }
    }

    .linaria {
      float: left;
      flex: 1;
      animation: custom-animation .2s;
    }

    .linaria:hover {
      float: right;
    }

    .linaria > span,
    .linaria + .linaria,
    .linaria ~ div {
      display: none;
    }

    .linaria > span {
      display: none;
    }

    .linaria::after {
      display: block;
    }

    .unrelated {
      animation-name: custom-animation;
    }

    .unrelated2 {
      animation: custom-animation .3s;
    }

    .lily {
      color: #fff;
    }

    [data-theme=dark] .lily {
      color: #000;
    }

    .unrelated3 {
      flex: 0;
    }

    .linaria ~ div {}
    .linaria.linaria2{}
  `;

  testCollect(html, css);
});

describe('simple class name', () => {
  const css = dedent`
    .linaria {}
    .classname {}
  `;

  testCollect(html, css);
});

describe('classname in @rule', () => {
  const css = dedent`
    @supports (object-fit: cover) { .linaria {} }
    @media (min-width: 600px) { .linaria {} }
    @charset () { .linaria {} }
    @import () { .linaria {} }
    @namespace () { .linaria {} }
    @media () { .linaria {} }
    @supports () { .linaria {} }
    @document () { .linaria {} }
    @page () { .linaria {} }
    @keyframes () { .linaria {} }
    @viewport () { .linaria {} }
    @counter-style () { .linaria {} }
    @font-feature-values () { .linaria {} }

    @supports (object-fit: cover) { .other {} }
    @media (min-width: 600px) { .other {} }
    @charset () { .other {} }
    @import () { .other {} }
    @namespace () { .other {} }
    @media () { .other {} }
    @supports () { .other {} }
    @document () { .other {} }
    @page () { .other {} }
    @keyframes () { .other {} }
    @viewport () { .other {} }
    @counter-style () { .other {} }
    @font-feature-values () { .other {} }
  `;

  testCollect(html, css);
});

describe('works with CSS combinators', () => {
  const css = dedent`
    .linaria + span {}
    .linaria ~ div {}
    .linaria > a {}
    .linaria b {}

    .other + span {}
    .other ~ div {}
    .other > a {}
    .other b {}
  `;
  testCollect(html, css);
});

describe('works with pseudo-class and pseudo-elements', () => {
  const css = dedent`
    .linaria:active {}
    .linaria::before {}

    .other:active {}
    .other::before {}
  `;
  testCollect(html, css);
});

describe('works with global css', () => {
  const css = dedent`
    body { font-size: 13.37px; }

    html { -webkit-font-smoothing: antialiased; }

    h1 { font-weight: bold; }

    .linaria:active {}
    .linaria::before {}

    .other:active {}
    .other::before {}
  `;

  const { critical, other } = collect(html, css);

  test('critical', async () =>
    expect(await prettyPrint(critical)).toMatchSnapshot());
  test('other', async () => expect(await prettyPrint(other)).toMatchSnapshot());
});

describe('handles top-level @font-face', () => {
  const css = dedent`
    @font-face {
      font-family: MyFont;
      font-weight: normal;
      font-style: normal;
      src: url(MyFont.woff);
    }
  `;
  const { critical, other } = collect(html, css);

  test('critical', async () =>
    expect(await prettyPrint(critical)).toMatchSnapshot());
  test('other', async () => expect(await prettyPrint(other)).toMatchSnapshot());
});

// there was a bug when the whole atrule was included for each child rule
describe('include atrule once', () => {
  const css = dedent`
    @media screen {
      body {
        font-size: 10px;
      }
      h1 {
        font-size: 20px;
      }
      .class {
        font-size: 15px;
      }
    }
  `;
  const { critical, other } = collect(html, css);

  test('critical', async () =>
    expect(await prettyPrint(critical)).toMatchSnapshot());
  test('other', async () => expect(await prettyPrint(other)).toMatchSnapshot());
});

describe('ignore empty class attribute', () => {
  const code = dedent`
    <div class=""></div>
    <div class="a"></div>
    <div class=""></div>
    <div class="b"></div>
    <div class=""></div>
  `;

  const css = dedent`
    .not-exist {}
  `;

  const { critical } = collect(code, css);
  test('critical should be empty', () => expect(critical).toEqual(''));
});

test('does not match selectors in ignoredClasses list', () => {
  const code = dedent`
    <div class="lily ltr dir"></div>
  `;

  const css = dedent`
    .linaria.dir {}
    .linaria.ltr {}
    .lily {}
  `;

  const { critical, other } = collect(code, css, {
    ignoredClasses: ['ltr', 'dir'],
  });
  expect(critical).toMatchInlineSnapshot(`".lily {}"`);
  expect(other).toMatchInlineSnapshot(`
    ".linaria.dir {}
    .linaria.ltr {}"
  `);
});

test('does not match selectors in blockedClasses list', () => {
  const code = dedent`
    <div class="lily linaria ltr dir"></div>
  `;

  const css = dedent`
    .linaria.ltr {}
    .linaria.rtl {}
    .lily {}
  `;

  const { critical, other } = collect(code, css, { blockedClasses: ['rtl'] });
  expect(critical).toMatchInlineSnapshot(`
    ".linaria.ltr {}
    .lily {}"
  `);
  expect(other).toMatchInlineSnapshot(`".linaria.rtl {}"`);
});

test('does not match child selectors in blockedClasses list for media queries', () => {
  const code = dedent`
    <div class="lily linaria ltr dir"></div>
  `;

  const css = dedent`
  @media only screen and (max-width:561.5px) {
    .dir-ltr.left_6_3_l9xil3s {
      padding-left: 24px !important;
    }

    .dir-rtl.left_6_3_l9xil3s {
      padding-right: 24px !important;
    }
  }
  `;

  const { critical, other } = collect(code, css, {
    blockedClasses: ['dir-rtl'],
  });

  expect(critical).toMatchInlineSnapshot(`
    "@media only screen and (max-width:561.5px) {
      .dir-ltr.left_6_3_l9xil3s {
        padding-left: 24px !important;
      }
    }"
  `);
  expect(other).toMatchInlineSnapshot(`
    "@media only screen and (max-width:561.5px) {

      .dir-rtl.left_6_3_l9xil3s {
        padding-right: 24px !important;
      }
    }"
  `);
});

const selectorsOf = (css: string) => {
  const selectors: string[] = [];
  postcss.parse(css).walkRules((rule) => {
    selectors.push(rule.selector);
  });
  return selectors;
};

test('splits rules of an at-rule between critical and other', () => {
  const css = dedent`
    @media (min-width: 600px) {
      .unrelated { color: red; }
      .linaria { color: blue; }
      .unrelated2 { color: green; }
    }
  `;

  const { critical, other } = collect(html, css);
  expect(selectorsOf(critical)).toEqual(['.linaria']);
  expect(selectorsOf(other)).toEqual(['.unrelated', '.unrelated2']);
});

test('excludes every rule with a blocked class', () => {
  const css = dedent`
    .linaria.rtl { color: red; }
    .linaria.rtl { color: blue; }
    .linaria.rtl { color: green; }
    .linaria { color: black; }
  `;

  const { critical } = collect(html, css, { blockedClasses: ['rtl'] });
  expect(selectorsOf(critical)).toEqual(['.linaria']);
});

test('keeps the whitespace between rules', () => {
  const critical = '.linaria {}\n.lily {}\n\n.lotus {}\n\n\n.linaria .lily {}';
  const other = '.other {}\n.other2 {}\n\n.other3 {}';

  expect(collect(html, `${critical}\n\n${other}`)).toEqual({ critical, other });
});

test('keeps the order of rules in a large stylesheet', () => {
  const rules: string[] = [];
  const expectedCritical: string[] = [];
  const expectedOther: string[] = [];
  for (let i = 0; i < 20000; i += 1) {
    if (i % 1000 === 0) {
      rules.push(
        `@media (min-width: ${i}px) { .linaria-${i} {} .other-${i} {} }`
      );
      expectedCritical.push(`.linaria-${i}`);
      expectedOther.push(`.other-${i}`);
    } else {
      const selector = i % 2 ? `.linaria-${i}` : `.other-${i}`;
      rules.push(`${selector} {}`);
      (i % 2 ? expectedCritical : expectedOther).push(selector);
    }
  }

  const { critical, other } = collect(html, rules.join('\n'));
  expect(selectorsOf(critical)).toEqual(expectedCritical);
  expect(selectorsOf(other)).toEqual(expectedOther);
});
