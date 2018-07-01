/* @flow */

import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import dedent from 'dedent';

import type { BabelTypes, NodePath } from '../types';

import { getCachedModule } from '../lib/moduleSystem';
import { relativeToCwd, makeAbsolute } from './utils';

const withPreamble = (filename, data) =>
  dedent`
  /**
   * THIS FILE IS AUTOGENERATED. DO NOT EDIT IT DIRECTLY OR COMMIT IT TO VERSION CONTROL.
   * SOURCE: ${filename}
   */

  ${data}
  `;

/**
 * Get output filename with directory structure from source preserved inside
 * custom outDir.
 */
function getOutputFilename(
  relativeFilename: string,
  absOutDir: string
): string {
  const basename = /(.+)\..+$/.exec(path.basename(relativeFilename))[1];
  const relativeOutputFilename = path.join(
    path.dirname(relativeFilename),
    `${basename}.css`
  );
  return path.join(absOutDir, relativeOutputFilename);
}

let stylesCache = {};

function hasCachedStyles(filename: string, styles: string) {
  return stylesCache[filename] && stylesCache[filename] === styles;
}

function createCssFromCache(filename) {
  return withPreamble(
    filename,
    Object.keys(stylesCache).reduce(
      (acc, file) => `${acc}\n${stylesCache[file]}`,
      ''
    )
  );
}

function addRequireForCss(
  types: BabelTypes,
  program: NodePath<*>,
  filename: string
) {
  program.node.body.unshift(
    types.expressionStatement(
      types.callExpression(types.identifier('require'), [
        types.stringLiteral(filename),
      ])
    )
  );
}

/**
 * Write styles to file and create directory if needed.
 */
function outputStylesToFile(
  filename: string,
  styles: string,
  throwImmediately: boolean = false
) {
  try {
    fs.writeFileSync(filename, styles);
  } catch (error) {
    if (
      !throwImmediately &&
      (error.code === 'ENOENT' || /ENOENT/.test(error.message))
    ) {
      mkdirp.sync(path.dirname(filename));
      outputStylesToFile(filename, styles, true);
    } else {
      throw error;
    }
  }
}

export default function extractStyles(
  types: BabelTypes,
  program: NodePath<*>,
  currentFilename: string,
  options: {
    single?: boolean,
    filename?: string,
    outDir?: string,
    cache?: boolean,
    extract?: boolean,
  }
) {
  // Normalize current filename path.
  const relativeCurrentFilename = relativeToCwd(currentFilename);
  const absCurrentFilename = makeAbsolute(currentFilename);

  const {
    single = false,
    cache = true,
    extract = true,
    outDir = '.linaria-cache',
    filename: basename = 'styles.css',
  } = options;

  const absOutDir = path.isAbsolute(outDir)
    ? outDir
    : path.join(process.cwd(), outDir);

  // If single === true, we compute filename from outDir and filename options,
  // since there will be only one file, otherwise we need to reconstruct directory
  // structure inside outDir. In that case filename option is discard.
  const filename = single
    ? path.join(absOutDir, basename)
    : getOutputFilename(relativeCurrentFilename, absOutDir);
  const importPath = `./${path.relative(
    path.dirname(absCurrentFilename),
    filename
  )}`;

  if (!extract) {
    return;
  }

  const sheet = getCachedModule(require.resolve('../../sheet.js'));
  const data = sheet ? sheet.exports.default.dump() : '';

  if (!data.length) {
    return;
  }

  if (cache) {
    if (single) {
      // If single === true, we cannot rely on filename since it will
      // always be the same, so we need to use absCurrentFilename.
      if (hasCachedStyles(absCurrentFilename, data)) {
        return;
      }
      stylesCache[absCurrentFilename] = data;
    } else {
      if (hasCachedStyles(filename, data)) {
        addRequireForCss(types, program, importPath);
        return;
      }
      stylesCache[filename] = data;
    }
  }

  if (single) {
    outputStylesToFile(
      filename,
      cache
        ? createCssFromCache(relativeCurrentFilename)
        : withPreamble(relativeCurrentFilename, data)
    );
  } else {
    outputStylesToFile(filename, withPreamble(relativeCurrentFilename, data));
    addRequireForCss(types, program, importPath);
  }
}

export function clearCache() {
  stylesCache = {};
}
