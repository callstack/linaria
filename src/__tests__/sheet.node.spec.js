import sheet from '../sheet';

beforeEach(sheet.dump);

describe('sheet module (node)', () => {
  it('should append styles', () => {
    sheet.append('some_selector', '{color:blue}');
    expect(sheet.dump()).toBe('some_selector{color:blue;}');
  });

  it('should give styles list', () => {
    sheet.append('some_selector', '{color:rebeccapurple}');
    expect(sheet.styles()).toEqual([
      { selector: 'some_selector', css: '{color:rebeccapurple}' },
    ]);
  });

  it('should insert styles', () => {
    sheet.insert('.foo {color:purple}');
    expect(sheet.dump()).toBe('.foo {color:purple}');
  });

  it('should clear cache on dump', () => {
    sheet.insert('.foo {color:palevioletred}');
    sheet.dump();
    expect(sheet.dump()).toBe('');
    expect(sheet.styles()).toEqual([]);
  });

  it('should throw error when getting rules', () => {
    expect(sheet.rules).toThrowError('Not implemented');
  });
});
