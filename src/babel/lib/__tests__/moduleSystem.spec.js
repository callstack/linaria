import path from 'path';
import NativeModule from 'module';
import {
  clearModulesCache,
  instantiateModule,
  Module,
  ModuleMock,
  getCachedModule,
  clearLocalModulesFromCache,
} from '../moduleSystem';

describe('babel/lib/moduleSystem', () => {
  beforeEach(clearModulesCache);

  it('instantiateModule should create module instance and store it in cache', () => {
    const filename = path.join(__dirname, 'test.js');
    const moduleInstance = instantiateModule(
      'module.exports = () => {}',
      filename
    );
    expect(typeof moduleInstance.exports).toEqual('function');
    expect(moduleInstance.id).toEqual(filename);
    expect(moduleInstance.filename).toEqual(filename);
    expect(moduleInstance.loaded).toBeTruthy();
    expect(moduleInstance.sourceMap).toBeDefined();
    expect(moduleInstance.children).toEqual([]);
    expect(getCachedModule(filename)).toEqual(moduleInstance);
  });

  it('clearLocalModulesFromCache should clear local modules from cache', () => {
    const filename = '/some/absolute/path/file.js';
    const filenameLinaria = path.join(__dirname, 'test.js');
    const filenameNodeModule = path.join(
      process.cwd(),
      'node_modules',
      'test-module'
    );

    instantiateModule('module.exports = () => {}', filename);
    instantiateModule('module.exports = () => {}', filenameLinaria);
    instantiateModule('module.exports = () => {}', filenameNodeModule);

    expect(getCachedModule(filename)).toBeDefined();
    expect(getCachedModule(filenameLinaria)).toBeDefined();
    expect(getCachedModule(filenameNodeModule)).toBeDefined();

    clearLocalModulesFromCache();

    expect(getCachedModule(filename)).toBeUndefined();
    expect(getCachedModule(filenameLinaria)).toBeDefined();
    expect(getCachedModule(filenameNodeModule)).toBeDefined();
  });

  it('ModuleMock should provide mocked implementation of native Node `module`', () => {
    Object.keys(NativeModule).forEach(key => {
      const value = NativeModule[key];
      if (typeof value === 'function') {
        expect(typeof ModuleMock[key]).toEqual('function');
      } else {
        expect(ModuleMock[key]).toBeDefined();
      }
    });

    expect(ModuleMock.Module).toEqual(ModuleMock);

    expect(ModuleMock('file.js')).toEqual(new Module('file.js'));
    const cache = ModuleMock._cache;
    expect(ModuleMock._debug()).toBeUndefined();
    expect(ModuleMock._preloadModules()).toBeUndefined();
    expect(ModuleMock._cache).toEqual(cache);

    const moduleInstance = instantiateModule(
      'module.exports = () => {}',
      '/file.js'
    );
    expect(ModuleMock._cache['/file.js']).toEqual(moduleInstance);

    expect(ModuleMock._load('path')).toEqual(path);
  });

  it('instance of Module should successfully require other modules', () => {
    const moduleInstance = new Module(__filename);

    const extHandler = ModuleMock._extensions['.js'];
    const mockExtHandler = jest.fn();
    ModuleMock._extensions['.js'] = mockExtHandler;

    moduleInstance.load();
    moduleInstance.load('file');
    moduleInstance.load('file.ext');

    expect(mockExtHandler).toHaveBeenCalledTimes(3);
    expect(moduleInstance.loaded).toBeTruthy();

    ModuleMock._extensions['.js'] = m => {
      m._compile(
        `module.exports = require('${require.resolve('../errorUtils')}')`
      );
    };

    moduleInstance.load();

    expect(moduleInstance.children.length).toBe(1);
    expect(Object.keys(moduleInstance.exports)).toEqual(
      // eslint-disable-next-line global-require
      Object.keys(require('../errorUtils'))
    );

    expect(moduleInstance.require('../errorUtils')).toBeDefined();

    ModuleMock._extensions['.js'] = extHandler;
  });

  it('instance of Module should throw code frame error', () => {
    try {
      instantiateModule(
        'function test() { throw new Error("test"); }\nmodule.exports = test();',
        __filename
      );
    } catch (error) {
      expect(error.message).toEqual('test');
      expect(error.stack).toMatch(`${__filename}:1:24`);
    }

    try {
      instantiateModule(
        `function test() {
          const error = new Error("test");
          error.isEnhanced = true;
          error.enhancedFrames = [{
            originalSource: '// test',
            lineNumber: 1,
            columnNumber: 0,
            fileName: '${__filename}'
          }]
          throw error;
        }
        module.exports = test();`,
        __filename
      );
    } catch (error) {
      expect(error.message).toEqual('test');
      expect(error.stack).toMatch(`${__filename}:1:0`);
    }
  });

  it('should instantiate a dummy wrapper module for unsupported file extensions', () => {
    const moduleInstance = instantiateModule(
      'module.exports = require("./image.svg");',
      path.join(__dirname, 'test.js')
    );
    expect(moduleInstance.exports).toEqual('./image.svg');
  });

  it('should instantiate a module for JSON file', () => {
    const content = { someColor: '#ffffff' };
    const moduleInstance = instantiateModule(
      JSON.stringify(content),
      path.join(__dirname, 'test.json')
    );
    expect(moduleInstance.exports).toEqual(content);
  });

  it('should throw meaningful error for JSON files', () => {
    expect(() => {
      instantiateModule(
        '{ "someColor": "#ffffff }',
        path.join(__dirname, 'test.json')
      );
    }).toThrowErrorMatchingSnapshot();
  });
});
