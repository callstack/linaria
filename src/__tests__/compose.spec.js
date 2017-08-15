/* eslint-disable global-require */
/* @flow */

import document from '../__mocks__/document';

global.window = global;
global.document = document;

const sheet = require('../sheet').default;
const compose = require('../compose').default;

describe('compose module', () => {
  it('should compose class names', () => {
    expect(compose('test')).toBe('test');
    expect(compose('title', 'heading')).toBe('title heading');
    expect(compose('title', 'purple green')).toBe('title purple green');
  });

  it('should adjust specificity of class name', () => {
    sheet.insert('.first', 'color: red;');
    sheet.insert('.second', 'color:blue;');
    expect(compose('second', 'first')).toBe('second first');
    expect(sheet.rules().list[0].cssText).toBe(
      '.first,.second.first {color: red;}'
    );
    expect(sheet.rules().list[1].cssText).toBe('.second {color: blue;}');
  });

  it('should return cached version if exists', () => {
    jest.mock('../sheet', () => ({
      rules() {
        throw new Error("Shouldn't access rules");
      },
    }));
    expect(() => compose('second', 'first')).not.toThrow();
    expect(compose('second', 'first')).toBe('second first');
  });
});
