// import './polyfill';
//
// import path from 'path';
//
// import * as babel from '@babel/core';
// import * as esbuild from 'esbuild';
// import { JSDOM, VirtualConsole } from 'jsdom';
// import type { JSX } from 'solid-js';
// import { render } from 'solid-js/web';
//
// import * as linaria from '@linaria/babel-preset';
//
// import { Tag } from './components.linaria';
//
// function transform(source: string): string {
//   const result = babel.transform(source, {
//     filename: 'test.tsx',
//     presets: ['@linaria'],
//   });
//   if (!result || !result.code)
//     throw new Error('Cannot transform source with babel');
//   return result.code;
// }
//
// function toHTMLElement(element: JSX.Element): HTMLElement {
//   if (element instanceof HTMLElement) {
//     return element;
//   }
//   throw new Error('Element is not an HTMLElement');
// }
//
// async function transpile(
//   source: string
// ): Promise<[code: readonly string[], css: string]> {
//   const linariaResult = await linaria.transform(
//     source,
//     { filename: 'test.tsx' },
//     (what) => Promise.resolve(require.resolve(what))
//   );
//   if (linariaResult.code === undefined || linariaResult.cssText === undefined) {
//     throw new Error('Cannot transpile source with linaria');
//   }
//   const solidResult = babel.transform(linariaResult.code, {
//     babelrc: false,
//     configFile: false,
//     presets: ['solid'],
//   });
//   if (solidResult === null || !solidResult.code) {
//     throw new Error('Cannot transpile source with babel+solid');
//   }
//   const { code } = solidResult;
//   const esbuildResult = await esbuild.build({
//     entryPoints: [path.resolve(__dirname, './esbuild.root.ts')],
//     treeShaking: true,
//     bundle: true,
//     platform: 'browser',
//     write: false,
//     plugins: [
//       {
//         name: 'virtual-entry-point',
//         setup(build) {
//           build.onLoad({ filter: /esbuild\.root\.ts$/ }, () => {
//             return {
//               contents: code,
//               loader: 'js',
//             };
//           });
//         },
//       },
//     ],
//   });
//   const content = esbuildResult.outputFiles.map((file) => file.text);
//   return [content, linariaResult.cssText];
// }
//
// describe('styled processor', () => {
//   describe('simple tag', () => {
//     it('foo', () => {
//       expect(Tag.toString()).toMatchSnapshot('s1');
//     });
//     // it('renders tag with class', () => {
//     //   const result = toHTMLElement(<Tag>hi</Tag>);
//     //   expect(result.classList.length).toBe(1);
//     // });
//     // it('renders children', () => {
//     //   const result = toHTMLElement(<Tag>hi</Tag>);
//     //   expect(result.textContent).toEqual('hi');
//     // });
//     // it('sets attributes', () => {
//     //   const result = toHTMLElement(<Tag data-foo={'foo'} />);
//     //   expect(result.dataset.foo).toEqual('foo');
//     // });
//     // it('sets class', () => {
//     //   const result = toHTMLElement(<Tag class={'foo'} />);
//     //   expect(result.classList).toContain('foo');
//     // });
//     // it('sets style', () => {
//     //   const result = toHTMLElement(<Tag style={{ color: 'blue' }} />);
//     //   expect(result.style.color).toEqual('blue');
//     // });
//     // it('interpolates props', async () => {
//     //   // const result = toHTMLElement(<Tag background={'red'} />);
//     //   // console.log(Tag.toString());
//     //   // // expect(result.style.background).toEqual('red');
//     //   const source = `
//     //     import { styled } from '@linaria/react';
//     //     const Tag = styled.div\`color: blue\`;
//     //   `.trim();
//     //   const babelResult = transform(source);
//     //   const linariaResult = await linaria.transform(
//     //     source,
//     //     {
//     //       filename: 'test.tsx',
//     //       pluginOptions: {},
//     //     },
//     //     (s) => Promise.resolve(s)
//     //   );
//     //   console.log(linariaResult.cssText);
//     // });
//     // it('jsdom with classes', () => {
//     //   const style = document.createElement('style');
//     //   style.textContent = `
//     //     .foo { color: blue; }
//     //   `;
//     //   document.head.append(style);
//     //   const div = document.createElement('div');
//     //   div.textContent = 'div';
//     //   div.classList.add('foo');
//     //   document.body.append(div);
//     //   expect(window.getComputedStyle(div).color).toBe('blue');
//     //   style.remove();
//     //   div.remove();
//     //   console.log('1', document.body.firstChild);
//     // });
//     // it('2', () => {
//     //   console.log('2', document.body.firstChild);
//     //   const span = document.createElement('span');
//     //   document.body.append(span);
//     // });
//     // it('test jsdom', () => {
//     //   const dom = new JSDOM(
//     //     `
//     //     <!DOCTYPE html>
//     //     <head>
//     //       <style>
//     //         .foo { color: red; }
//     //       </style>
//     //     </head>
//     //     <body>
//     //       <div id="foo" class="foo">hi</div>
//     //     </body>
//     //   `,
//     //     {
//     //       url: 'http://localhost',
//     //       runScripts: 'dangerously',
//     //       pretendToBeVisual: true,
//     //     }
//     //   );
//     //   const div = dom.window.document.getElementById('foo');
//     //   if (div instanceof dom.window.HTMLElement) {
//     //     // div.style.setProperty('color', 'blue');
//     //     // expect(div.style.getPropertyValue('color')).toBe('blue');
//     //     console.log(dom.window.getComputedStyle(div).color);
//     //     console.log('color', div.style.color);
//     //     console.log(
//     //       'getPropertyValue(color)',
//     //       div.style.getPropertyValue('color')
//     //     );
//     //   }
//     // });
//     it('fffff', async () => {
//       const [modules, css] = await transpile(`
//         import { styled } from '@linaria/solid';
//         import { render } from 'solid-js/web';
//         const Foo = styled.div\`color: blue\`;
//         render(() => <Foo>hi</Foo>, document.getElementById('root'));
//       `);
//       const virtualConsole = new VirtualConsole();
//       virtualConsole.sendTo(console);
//       const dom = new JSDOM(
//         `
//           <!DOCTYPE html>
//           <head>
//             <style>${css}</style>
//           </head>
//           <body>
//             <div id="root"></div>
//             ${modules.map((m) => `<script>${m}</script>`)}
//           </body>
//         `,
//         {
//           url: 'http://localhost',
//           runScripts: 'dangerously',
//           pretendToBeVisual: true,
//         }
//       );
//       const root = dom.window.document.getElementById('root');
//       console.log(root?.innerHTML);
//     });
//     it('fff', async () => {
//       const source = `
//         import { styled } from '@linaria/solid';
//         import { render } from 'solid-js/web';
//         const Foo = styled.div\`color: blue\`;
//         render(() => <Foo>hi</Foo>, document.getElementById('root'));
//       `;
//       const result = await linaria.transform(
//         source,
//         { filename: 'test.tsx' },
//         (what) => Promise.resolve(require.resolve(what))
//       );
//       if (!result.code || !result.cssText) {
//         throw new Error('Cannot transpile source with linaria');
//       }
//       const result2 = babel.transform(result.code, {
//         babelrc: false,
//         configFile: false,
//         presets: ['solid'],
//       });
//       if (!result2?.code) {
//         throw new Error('Cannot transpile source with babel');
//       }
//       // const result3 = esbuild.transformSync(result2.code, {
//       //   platform: 'browser',
//       //   treeShaking: true,
//       //   bundle: true
//       // });
//       const r = await esbuild.build({
//         entryPoints: [path.resolve(__dirname, './esbuild.root.ts')],
//         treeShaking: true,
//         bundle: true,
//         platform: 'browser',
//         write: false,
//         plugins: [
//           {
//             name: 'virtual-entry-point',
//             setup(build) {
//               build.onResolve(
//                 { filter: /^@linaria\/solid\/test-entry$/ },
//                 (args) => ({
//                   path: args.path,
//                   namespace: '@linaria/solid/test-entry',
//                 })
//               );
//               build.onLoad({ filter: /^@linaria\/solid\/test-entry$/ }, () => {
//                 return {
//                   contents: JSON.stringify({ foo: 123 }),
//                   loader: 'json',
//                 };
//               });
//             },
//           },
//         ],
//       });
//       // console.log(r.outputFiles.map((f) => f.text));
//       // return;
//       const virtualConsole = new VirtualConsole();
//       virtualConsole.sendTo(console);
//       const dom = new JSDOM(
//         `
//           <!DOCTYPE html>
//           <head>
//             <style>
//               #root { color: blue; }
//             </style>
//           </head>
//           <body>
//             <div id="root"></div>
//             <script>
//               const child = document.createElement('div')
//               child.textContent = 'child'
//               document.getElementById('root').appendChild(child)
//               console.log('Hello from jsdom')
//               // throw new Error('Error from jsdom')
//             </script>
// <!--            <script type="module">-->
// <!--              const root = document.getElementById('root')-->
// <!--              root.innerText = 'HEYA'-->
// <!--              console.log('WOHOO')-->
// <!--            </script>-->
//           </body>
//         `,
//         {
//           url: 'http://localhost',
//           runScripts: 'dangerously',
//           pretendToBeVisual: true,
//         }
//       );
//       // console.log(result2.code);
//       const root = dom.window.document.getElementById('root');
//       if (!root) throw new Error('Cannot find root');
//       // root.textContent = 'BAR';
//       // console.info({
//       //   color: dom.window.getComputedStyle(root).color,
//       //   content: root.textContent,
//       // });
//       // console.log(root?.textContent);
//     });
//   });
// });
import type { JSX } from 'solid-js';
import { render } from 'solid-testing-library';

import { Tag } from './components.linaria';

const renderComponent = (component: () => JSX.Element): HTMLElement => {
  const child = render(component).container.firstElementChild;
  if (child instanceof HTMLElement) return child;
  throw new Error('Cannot render component');
};

describe('styled processor', () => {
  it('renders primitive children', () => {
    const result = renderComponent(() => <Tag>Text</Tag>);
    expect(result.textContent).toEqual('Text');
  });
  it('renders complex children', () => {
    const result = renderComponent(() => (
      <Tag>
        <span>Text</span>
      </Tag>
    ));
    expect(Array.from(result.children)).toEqual([<span>Text</span>]);
  });
  it('sets static styles', () => {
    const result = renderComponent(() => <Tag />);
    expect(getComputedStyle(result).color).toEqual('red');
  });
  it('sets non-reactive dynamic styles', () => {
    const component = () => {
      return (
        <div
          class={'Tag_tlhry5p'}
          style={{
            // background: 'red',
            '--tlhry5p-0': 'blue',
          }}
        ></div>
      );
    };
    console.log(component.toString());
    const result = renderComponent(component);
    console.log(document.head.innerHTML);
    console.log(Array.from(result.classList));
    console.log(Tag.toString());
    const computed = getComputedStyle(result);
    console.info({
      color: computed.color,
      background: computed.background,
      backgroundColor: computed.backgroundColor,
      t: result.style.getPropertyValue('--tlhry5p-0'),
    });
  });
});
