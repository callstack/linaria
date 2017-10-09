/* @flow */

import dedent from 'dedent';
import slugify from './slugify';
import sheet from './sheet';
import { getFramesFromStack, enhanceFrames } from './babel/lib/errorUtils';

const named = (name?: string = 'css', filename: ?string = null) => (
  template: string[],
  ...expressions: string[]
) => {
  expressions.forEach((expression, index) => {
    if (expression === undefined || expression === null) {
      const error = new Error('Expression cannot be undefined or null');

      // Get frames with current (this module) stack without any garbage.
      let foundFrame = false;
      const framesWithCurrentStack = getFramesFromStack(
        error,
        frames =>
          frames.findIndex(frame => {
            const frameMatch = frame.fileName === __filename;
            // There will be 2 frames with this __filename and we need to include them both.
            if (frameMatch && !foundFrame) {
              foundFrame = true;
            } else if (frameMatch) {
              return true;
            }
            return false;
          }) + 1
      );

      // Get rid of current stack, so there should be only 1 frame pointing to
      // source file.
      const framesWithoutCurrentStack = framesWithCurrentStack.filter(
        frame => frame.fileName !== __filename
      );

      const templateLines = template
        .slice(0, index + 1)
        .join('')
        .split('\n');

      // Get offsets based on how many lines current tagged template expression has.
      const lineOffset = templateLines.length - 1;
      const columnOffset =
        lineOffset > 0 ? templateLines[templateLines.length - 1].length + 3 : 0;

      // Enhance frames with source maps, since we need to add offsets after it's already
      // processed by enhancer.
      const enhancedFrames = enhanceFrames(
        framesWithoutCurrentStack,
        require.cache
      );

      enhancedFrames[0].lineNumber += lineOffset;
      enhancedFrames[0].columnNumber += columnOffset;

      // $FlowFixMe
      error.isEnhanced = true;
      // $FlowFixMe
      error.enhancedFrames = enhancedFrames;

      throw error;
    }
  });

  const styles = dedent(template, ...expressions).trim();
  const slug = slugify(filename || styles);
  const classname = `${name}__${slug}`;

  sheet.insert(`.${classname}`, styles);

  return classname;
};

const css = named();

css.named = named;

export default css;
