import type { FeatureFlag } from '@linaria/utils';
import { isFeatureEnabled } from '@linaria/utils';

describe('isFeatureEnabled', () => {
  interface IFeatures {
    foo?: FeatureFlag;
  }

  const file = '/some/path/to/file.ts';

  const check = (obj: IFeatures) => isFeatureEnabled(obj, 'foo', file);

  it.each<[result: 'disabled' | 'enabled', title: string, obj: IFeatures]>([
    ['disabled', 'undefined', {}],
    ['disabled', 'if explicitly disabled', { foo: false }],
    ['enabled', 'if explicitly enabled', { foo: true }],
    ['enabled', '*', { foo: '*' }],
    ['enabled', '**/*', { foo: '**/*' }],
    ['enabled', 'one of file matches', { foo: file }],
    ['enabled', 'match any file', { foo: ['/first.js', file, '/last.js'] }],
    [
      'disabled',
      'nothing is matched',
      { foo: ['/first.js', '/second.js', '/last.js'] },
    ],
    ['enabled', 'file matches glob', { foo: '/some/**/*' }],
    ['disabled', 'file does not match glob', { foo: '/other/**/*' }],
    [
      'enabled',
      'file matches one of globs',
      { foo: ['/other/**/*', '/some/**/*'] },
    ],
    [
      'disabled',
      'file does not match any of globs',
      { foo: ['/other/**/*', '/another/**/*'] },
    ],
    ['disabled', 'file matches negated glob', { foo: '!/some/**/*' }],
    [
      'disabled',
      'file does not match negated glob and there is no other rules',
      { foo: '!/other/**/*' },
    ],
    [
      'disabled',
      'file does not match glob and matches negated glob',
      { foo: ['/other/**/*', '!/some/**/*'] },
    ],
    [
      'disabled',
      'file does not match glob and matches negated glob',
      { foo: ['/other/**/*', '!/other/**/*'] },
    ],
    [
      'disabled',
      'file matches matches glob and then negated glob',
      { foo: ['/some/**/*', '!**/*.ts'] },
    ],
  ])(`should be %s if %s`, (result, _, obj) => {
    expect(check(obj)).toBe(result === 'enabled');
  });
});
