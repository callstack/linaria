/* eslint-disable global-require */
/* @flow */

import dedent from 'dedent';
import document from '../__mocks__/document';

global.window = global;
global.document = document;

const sheet = require('../sheet').default;

describe('sheet module (browser)', () => {
  it('should insert a stylesheet', () => {
    expect(document.head.children[0].constructor.name).toBe('HTMLStyleElement');
    expect(document.head.children[0].textContent).toEqual('');
  });

  it('should insert styles', () => {
    sheet.insert('.some_selector', '{color:blue}');
    sheet.insert('.foo', '{color:purple;font-size:12px;}');
    expect(document.head.children[0].textContent.trim()).toBe(dedent`
      .some_selector{color:blue;}
      .foo{color:purple;font-size:12px;}
    `);
    expect(document.head.children[0].textContent.trim()).toBe(dedent`
      .some_selector{color:blue;}
      .foo{color:purple;font-size:12px;}
    `);
  });

  it('should return list of rules', () => {
    let rules;

    rules = sheet.rules();

    expect(rules.cache).toBe(false);
    expect(rules.list[0].selectorText).toEqual('.some_selector');
    expect(rules.list[0].cssText).toEqual('.some_selector {color: blue;}');
    expect(rules.list[1].selectorText).toEqual('.foo');
    expect(rules.list[1].cssText).toEqual(
      '.foo {color: purple; font-size: 12px;}'
    );

    rules = sheet.rules();

    expect(rules.cache).toBe(true);
    expect(rules.list[0].selectorText).toEqual('.some_selector');
    expect(rules.list[0].cssText).toEqual('.some_selector {color: blue;}');
    expect(rules.list[1].selectorText).toEqual('.foo');
    expect(rules.list[1].cssText).toEqual(
      '.foo {color: purple; font-size: 12px;}'
    );
  });

  it('should throw when `head` is null', () => {
    jest.resetModules();
    /* $FlowFixMe */
    document.head = null;
    expect(() => require('../sheet').default).toThrowError(
      'Unable to insert stylesheet'
    );
  });
});
