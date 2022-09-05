import './polyfill';

import * as babel from '@babel/core';
import { JSDOM } from 'jsdom';
import type { JSX } from 'solid-js';

import * as linaria from '@linaria/babel-preset';

import { Tag } from './components.linaria';

function transform(source: string): string {
  const result = babel.transform(source, {
    filename: 'test.tsx',
    presets: ['@linaria'],
  });
  if (!result || !result.code)
    throw new Error('Cannot transform source with babel');
  return result.code;
}

function toHTMLElement(element: JSX.Element): HTMLElement {
  if (element instanceof HTMLElement) {
    return element;
  }
  throw new Error('Element is not an HTMLElement');
}

describe('styled processor', () => {
  describe('simple tag', () => {
    // it('renders tag with class', () => {
    //   const result = toHTMLElement(<Tag>hi</Tag>);
    //   expect(result.classList.length).toBe(1);
    // });
    // it('renders children', () => {
    //   const result = toHTMLElement(<Tag>hi</Tag>);
    //   expect(result.textContent).toEqual('hi');
    // });
    // it('sets attributes', () => {
    //   const result = toHTMLElement(<Tag data-foo={'foo'} />);
    //   expect(result.dataset.foo).toEqual('foo');
    // });
    // it('sets class', () => {
    //   const result = toHTMLElement(<Tag class={'foo'} />);
    //   expect(result.classList).toContain('foo');
    // });
    // it('sets style', () => {
    //   const result = toHTMLElement(<Tag style={{ color: 'blue' }} />);
    //   expect(result.style.color).toEqual('blue');
    // });
    // it('interpolates props', async () => {
    //   // const result = toHTMLElement(<Tag background={'red'} />);
    //   // console.log(Tag.toString());
    //   // // expect(result.style.background).toEqual('red');
    //   const source = `
    //     import { styled } from '@linaria/react';
    //     const Tag = styled.div\`color: blue\`;
    //   `.trim();
    //   const babelResult = transform(source);
    //   const linariaResult = await linaria.transform(
    //     source,
    //     {
    //       filename: 'test.tsx',
    //       pluginOptions: {},
    //     },
    //     (s) => Promise.resolve(s)
    //   );
    //   console.log(linariaResult.cssText);
    // });
    it('jsdom with classes', () => {
      const style = document.createElement('style');
      style.textContent = `
        .foo { color: blue; }
      `;
      document.head.append(style);
      const div = document.createElement('div');
      div.textContent = 'div';
      div.classList.add('foo');
      document.body.append(div);
      expect(window.getComputedStyle(div).color).toBe('blue');
      style.remove();
      div.remove();
      console.log('1', document.body.firstChild);
    });
    it('2', () => {
      console.log('2', document.body.firstChild);
      const span = document.createElement('span');
      document.body.append(span);
    });
    // it('test jsdom', () => {
    //   const dom = new JSDOM(
    //     `
    //     <!DOCTYPE html>
    //     <head>
    //       <style>
    //         .foo { color: red; }
    //       </style>
    //     </head>
    //     <body>
    //       <div id="foo" class="foo">hi</div>
    //     </body>
    //   `,
    //     {
    //       url: 'http://localhost',
    //       runScripts: 'dangerously',
    //       pretendToBeVisual: true,
    //     }
    //   );
    //   const div = dom.window.document.getElementById('foo');
    //   if (div instanceof dom.window.HTMLElement) {
    //     // div.style.setProperty('color', 'blue');
    //     // expect(div.style.getPropertyValue('color')).toBe('blue');
    //     console.log(dom.window.getComputedStyle(div).color);
    //     console.log('color', div.style.color);
    //     console.log(
    //       'getPropertyValue(color)',
    //       div.style.getPropertyValue('color')
    //     );
    //   }
    // });
    it('fff', async () => {
      const source = `
        import { styled } from '@linaria/solid'
        const Foo = styled.div\`color: blue\`
      `;
      const result = await linaria.transform(
        source,
        {
          filename: 'test.tsx',
        },
        (what: string, importer: string, stack: string[]) => {
          console.info({
            what,
            importer,
          });
          return Promise.resolve('');
        }
      );
      console.log(result);
    });
  });
});
