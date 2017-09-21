import { SourceMapConsumer } from 'source-map';
import stripAnsi from 'strip-ansi';
import {
  getFramesFromStack,
  enhanceFrames,
  buildCodeFrameError,
} from '../errorUtils';

jest.mock('source-map');

describe('babel/lib/errorUtils', () => {
  beforeEach(() => {
    SourceMapConsumer.mockClear();
  });

  it('getFramesFromStack should return parsed frames from stacktrace', () => {
    const error = new Error('test');
    const frames = getFramesFromStack(error, __filename);
    expect(frames.length).toBe(1);
    expect(frames[0].fileName).toEqual(__filename);
    expect(frames[0].source).toBeDefined();
    expect(frames[0].functionName).toBeDefined();
    expect(frames[0].lineNumber).toBeDefined();
    expect(frames[0].columnNumber).toBeDefined();
  });

  it('enhanceFrames return modified frames based on source maps', () => {
    SourceMapConsumer.mockImplementation(sourceMap => ({
      sourcesContent: sourceMap.sourcesContent,
      originalPositionFor({ line, column }) {
        return sourceMap.maps[`${line}:${column}`];
      },
    }));

    const frames = [
      {
        fileName: 'file1.js',
        source: 'source1',
        functionName: 'testFn1',
        lineNumber: 10,
        columnNumber: 8,
      },
      {
        fileName: 'file2.js',
        source: 'source2',
        functionName: 'testFn2',
        lineNumber: 12,
        columnNumber: 4,
      },
    ];

    const modulesCache = {
      'file1.js': {
        sourceMap: {
          sourcesContent: ['sourceContent 1'],
          maps: {
            '10:8': { line: 8, column: 8 },
          },
        },
      },
      'file2.js': {
        sourceMap: {
          sourcesContent: ['sourceContent 2'],
          maps: {
            '12:4': { line: null, column: null },
          },
        },
      },
    };

    expect(enhanceFrames(frames, modulesCache)).toEqual([
      {
        fileName: 'file1.js',
        source: 'source1',
        functionName: 'testFn1',
        lineNumber: 8,
        columnNumber: 8,
        originalSource: 'sourceContent 1',
      },
      {
        fileName: 'file2.js',
        source: 'source2',
        functionName: 'testFn2',
        lineNumber: 12,
        columnNumber: 4,
        originalSource: 'sourceContent 2',
      },
    ]);
  });

  it('buildCodeFrameError should build code frame error', () => {
    const error = {
      message: 'Test message',
    };

    const frames = [
      {
        fileName: 'file1.js',
        source: 'source1',
        functionName: 'testFn1',
        lineNumber: 2,
        columnNumber: 8,
        originalSource: '// comment\nthrow new Error("test");',
      },
      {
        fileName: 'file2.js',
        source: 'source2',
        functionName: 'testFn2',
        lineNumber: 12,
        columnNumber: 4,
      },
    ];

    const newError = buildCodeFrameError(error, frames);

    expect(newError.message).toEqual('Test message');
    expect(stripAnsi(newError.stack)).toMatchSnapshot();
  });
});
