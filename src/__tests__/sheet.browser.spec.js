/* eslint-disable global-require */
/* @flow */

import createDocument from '../__mocks__/createDocument';

const document = createDocument();

global.document = document;
global.window = global;

const sheet = require('../sheet').default;

describe('sheet module (browser)', () => {
  it('should insert a stylesheet', () => {
    expect(document.head.children[0].__type).toBe('style');
    expect(document.head.children[0].children[0].__text).toEqual(['']);
  });

  it('should append styles', () => {
    sheet.append('some_selector', '{color:blue}');
    expect(document.head.children[0].children[0].__text[1]).toBe(
      'some_selector{color:blue;}'
    );
  });

  it('should insert styles', () => {
    sheet.insert('.foo {color:purple}');
    expect(document.head.children[0].children[0].__text[2]).toBe(
      '.foo {color:purple}'
    );
  });

  it('should return list of rules', () => {
    const list = [
      { cssText: 'some_selector{color:blue;}', selector: 'some_selector' },
      { cssText: '.foo {color:purple}', selector: '.foo' },
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
