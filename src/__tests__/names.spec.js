/* @flow */

import names from '../names';

describe('names module', () => {
  it('should join class names', () => {
    expect(names('test')).toBe('test');
    expect(names('title', 'heading')).toBe('title heading');
  });

  it('should handle already joined names', () => {
    expect(names('title', 'purple green')).toBe('title purple green');
  });

  it('should filter out falsy values', () => {
    expect(names('title', 0, undefined, false, 'orange', 'text', null)).toBe(
      'title orange text'
    );
  });
});
