import shouldKeepSideEffect from '../../utils/shouldKeepSideEffect';

describe('shouldKeepSideEffect', () => {
  it('allows modules', () => {
    expect(shouldKeepSideEffect('@babel/runtime')).toBeTruthy();
    expect(shouldKeepSideEffect('regenerator-runtime')).toBeTruthy();

    expect(shouldKeepSideEffect('./side-effect')).toBeTruthy();
  });

  it('allows extensions', () => {
    expect(shouldKeepSideEffect('./side-effect.js')).toBeTruthy();
    expect(shouldKeepSideEffect('./side-effect.cjs')).toBeTruthy();
    expect(shouldKeepSideEffect('./side-effect.mjs')).toBeTruthy();

    expect(shouldKeepSideEffect('regenerator-runtime/runtime.js')).toBeTruthy();
  });

  it('skips assets', () => {
    expect(shouldKeepSideEffect('./asset.css')).toBeFalsy();
    expect(shouldKeepSideEffect('./asset.scss')).toBeFalsy();
  });
});
