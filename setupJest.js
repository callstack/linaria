/* @flow */
import stripAnsi from 'strip-ansi'; // eslint-disable-line import/no-extraneous-dependencies
import escapeStringRegexp from 'escape-string-regexp'; // eslint-disable-line import/no-extraneous-dependencies

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
