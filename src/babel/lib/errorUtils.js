/* @flow */

import { SourceMapConsumer } from 'source-map';
import codeFrame from 'babel-code-frame';
import errorStackParser from 'error-stack-parser';

type Frame = {
  functionName: string,
  lineNumber: number,
  columnNumber: number,
  fileName: string,
  source: string,
};

type EnhancedFrame = Frame & { originalSource: string };

export function getFramesFromStack(
  error: Error,
  findLastFrame?: (frames: Frame[]) => number
): Frame[] {
  const allFrames = errorStackParser.parse(error);
  const lastMeaningfulFrame = findLastFrame
    ? findLastFrame(allFrames)
    : allFrames.length - 1;
  return allFrames.slice(0, lastMeaningfulFrame + 1);
}

export function enhanceFrames(
  frames: Frame[],
  modulesCache: { [key: string]: Object }
): EnhancedFrame[] {
  return frames.map(frame => {
    const consumer = SourceMapConsumer(modulesCache[frame.fileName].sourceMap);

    const originalPosition = consumer.originalPositionFor({
      line: frame.lineNumber,
      column: frame.columnNumber,
    });

    return {
      ...frame,
      lineNumber:
        originalPosition.line !== null
          ? originalPosition.line
          : frame.lineNumber,
      columnNumber:
        originalPosition.column !== null
          ? originalPosition.column
          : frame.columnNumber,
      originalSource: consumer.sourcesContent[0],
    };
  });
}

export function buildCodeFrameError(
  error: Error,
  frames: EnhancedFrame[]
): Error {
  const firstFrame = frames && frames[0];

  if (!firstFrame) {
    return error;
  }

  const codeFrameString = codeFrame(
    firstFrame.originalSource,
    firstFrame.lineNumber,
    firstFrame.columnNumber,
    {
      highlightCode: true,
      linesAbove: 4,
      /* istanbul ignore next line */
      forceColor: !!process.env.CI,
    }
  );

  const callStack = frames
    .map(
      frame => `at ${frame.fileName}:${frame.lineNumber}:${frame.columnNumber}`
    )
    .join('\n');

  error.stack = `Error: ${error.message}\n${codeFrameString}\n${callStack}`;
  return error;
}
