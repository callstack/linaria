/* eslint-disable global-require */
/* @flow */

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
    sheet.insert('.foo', '{color:purple;}');
    expect(document.head.children[0].textContent).toBe(
      '.some_selector{color:blue;}.foo{color:purple;}'
    );
  });

  it('should return list of rules', () => {
    const list = [
      {
        cssText: '.some_selector{color:blue;}',
        selectorText: '.some_selector',
      },
      { cssText: '.foo{color:purple;}', selectorText: '.foo' },
    ];

    expect(sheet.rules()).toEqual({ cache: false, list });
    expect(sheet.rules()).toEqual({ cache: true, list });
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
