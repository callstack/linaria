/* @flow */
/* eslint-disable import/no-extraneous-dependencies */

import { toMatchImageSnapshot } from 'jest-image-snapshot';
import stripAnsi from 'strip-ansi';
import escapeStringRegexp from 'escape-string-regexp';

/* istanbul ignore next */
const serialize = val =>
  stripAnsi(
    val
      .toString()
      .replace(new RegExp(escapeStringRegexp(process.cwd()), 'gm'), '<<CWD>>')
  );

// $FlowFixMe
expect.addSnapshotSerializer({
  test: val => val && val.toString && val.toString().includes(process.cwd()),
  serialize,
});

expect.extend({ toMatchImageSnapshot });
