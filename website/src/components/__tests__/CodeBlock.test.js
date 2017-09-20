/* @flow */
import React from 'react';
import render from 'preact-render-to-string';
// import { collect } from 'linaria/server';
import CodeBlock from '../CodeBlock';
// import Container from '../Container';

test('CodeBlock', () => {
  const tree = render(<CodeBlock text="testxx" />, {}, { pretty: true });
  // const tree2 = render(
  //   <Container>
  //     <CodeBlock text="testxx" />
  //   </Container>,
  //   {},
  //   { pretty: true }
  // );
  // delete window.document;
  // console.log(Module);
  // const Module = require('module');
  // console.log(require('../../../../build/sheet').default.styles());
  // const sheet = Module._cache[require.resolve('linaria/build/sheet')];
  console.log(document.styleSheets);
  // console.log(require.resolve('linaria/build/sheet'));
  // console.log(require.requireActual('linaria/build/sheet').default.styles());
  // console.log(sheet.exports.default.styles());
  // console.log(sheet);

  // expect(tree).toMatchSnapshot();
});
