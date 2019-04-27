import dedent from 'dedent';
import prettier from 'prettier';
import collect from '../collect';

const prettyPrint = (src: string) => prettier.format(src, { parser: 'scss' });

const testCollect = (html: string, css: string) => {
  const { critical, other } = collect(html, css);
  test('critical', () => expect(prettyPrint(critical)).toMatchSnapshot());
  test('other', () => expect(prettyPrint(other)).toMatchSnapshot());
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
    @font-face () { .linaria {} }
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
    @font-face () { .other {} }
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

  test('critical', () => expect(prettyPrint(critical)).toMatchSnapshot());
  test('other', () => expect(prettyPrint(other)).toMatchSnapshot());
});
