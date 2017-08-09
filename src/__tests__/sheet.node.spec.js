import sheet from '../sheet';

describe('sheet module (node)', () => {
  it('should append styles', () => {
    sheet.append('some_selector', '{color:blue}');
    expect(sheet.dump()).toBe('some_selector{color:blue;}');
    expect(sheet.styles()).toEqual([
      { selector: 'some_selector', css: '{color:blue}' },
    ]);
  });

  it('should insert styles', () => {
    sheet.insert('.foo {color:purple}');
    expect(sheet.dump()).toBe('.foo {color:purple}');
  });

  it('should throw error when getting rules', () => {
    expect(sheet.rules).toThrowError('Not implemented');
  });
});
