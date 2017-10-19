/* @flow */

// eslint-disable-next-line import/no-extraneous-dependencies
import stripAnsi from 'strip-ansi';
// eslint-disable-next-line import/no-extraneous-dependencies
import escapeStringRegexp from 'escape-string-regexp';

const serialize = val =>
  stripAnsi(
    val
      .toString()
      .replace(
        new RegExp(escapeStringRegexp(process.cwd()), 'gm'),
        '<<REPLACED>>'
      )
  );

// $FlowFixMe
expect.addSnapshotSerializer({
  test: val => val && val.toString && val.toString().includes(process.cwd()),
  serialize,
  print: serialize,
});
