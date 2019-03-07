/* @flow */

export type State = {|
  rules: {
    [selector: string]: {
      className: string,
      displayName: string,
      cssText: string,
      start: ?Location,
    },
  },
  replacements: Array<{
    original: { start: Location, end: Location },
    length: number,
  }>,
  index: number,
  dependencies: string[],
  file: {
    opts: {
      cwd: string,
      root: string,
      filename: string,
    },
    metadata: any,
  },
|};

export type StrictOptions = {|
  displayName: boolean,
  evaluate: boolean,
  ignore: RegExp,
  babelOptions: Object,
|};

export type Location = {
  line: number,
  column: number,
};
