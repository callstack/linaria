import path from 'path';
import stylisResolvePlugin from '../stylisResolvePlugin';
import env from '@linaria_provide/env'; // eslint-disable-line

jest.mock('@linaria_provide/env', () => ({ config: {} }), { virtual: true });
jest.mock('glob', () => ({
  // eslint-disable-next-line global-require
  sync: jest.fn(() => require('path').resolve('static/Image.jpg')),
}));

describe('stylis resolve plugin', () => {
  beforeEach(() => {
    env.config.single = undefined;
    env.config.outDir = undefined;
    env.config.filename = undefined;
    env.filename = path.resolve('src/components/Container.js');
  });

  it('should do nothing', () => {
    expect(stylisResolvePlugin(2, "url('abc')")).toEqual("url('abc')");
    expect(stylisResolvePlugin(1, 'background:none')).toEqual(
      'background:none'
    );
    expect(
      stylisResolvePlugin(
        1,
        `background:url('${path.resolve('static/Image.jpg')}')`
      )
    ).toEqual(`background:url('${path.resolve('static/Image.jpg')}')`);
  });

  it('should resolve correct path without custom config', () => {
    expect(
      stylisResolvePlugin(1, "background:url('../../static/Image.jpg')")
    ).toEqual("background:url('../../../static/Image.jpg')");

    env.filename = 'src/components/Container.js';
    expect(
      stylisResolvePlugin(1, "background:url('../../static/Image.jpg')")
    ).toEqual("background:url('../../../static/Image.jpg')");
  });

  it('should resolve correct path with custom `outDir`', () => {
    env.config.outDir = 'node_modules/.cache/linaria';
    expect(
      stylisResolvePlugin(1, "background:url('../../static/Image.jpg')")
    ).toEqual("background:url('../../../../../static/Image.jpg')");
  });

  it('should resolve correct path with custom `single: true` and custom `outDir`', () => {
    env.config.single = true;
    env.config.filename = 'styles.css';
    env.config.outDir = 'dist';
    expect(
      stylisResolvePlugin(1, "background:url('../../static/Image.jpg')")
    ).toEqual("background:url('../static/Image.jpg')");
  });
});
