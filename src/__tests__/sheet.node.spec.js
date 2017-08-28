import sheet from '../sheet';

beforeEach(sheet.dump);

describe('sheet module (node)', () => {
  it('should insert styles', () => {
    sheet.insert('some_selector', '{color:blue}');
    expect(sheet.dump()).toBe('some_selector{color:blue;}');
  });

  it('should give styles list', () => {
    sheet.insert('some_selector', '{color:rebeccapurple}');
    expect(sheet.styles()).toEqual({
      some_selector: '{color:rebeccapurple}',
    });
  });

  it('should clear cache on dump', () => {
    sheet.insert('.foo', '{color:palevioletred}');
    expect(sheet.styles()).toEqual({ '.foo': '{color:palevioletred}' });
    sheet.dump();
    expect(sheet.dump()).toBe('');
    expect(sheet.styles()).toEqual({});
  });

  it('should throw error when getting rules', () => {
    expect(sheet.rules).toThrow('Not implemented');
  });

  it('should not insert same css multiple times', () => {
    sheet.insert('.lol', '{color:pink}');
    sheet.insert('.lol', '{color:pink}');

    expect(sheet.dump()).toBe('.lol{color:pink;}');
  });
});
