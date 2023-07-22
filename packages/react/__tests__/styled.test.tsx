import React from 'react';

import { omit } from '../src/styled';

const renderer = require('react-test-renderer');

const { styled } = require('../src');

it('renders tag with display name and class name', () => {
  const Test = styled('h1')({
    name: 'TestComponent',
    class: 'abcdefg',
  });

  expect(Test.displayName).toBe('TestComponent');
  expect(Test.__linaria.className).toBe('abcdefg');
  expect(Test.__linaria.extends).toBe('h1');

  const tree = renderer.create(<Test>This is a test</Test>);

  expect(tree.toJSON()).toMatchSnapshot();
});

it('renders component with display name and class name', () => {
  const Custom: React.FC = (props) => <div {...props} />;

  const Test = styled(Custom)({
    name: 'TestComponent',
    class: 'abcdefg',
  });

  expect(Test.displayName).toBe('TestComponent');
  expect(Test.__linaria.className).toBe('abcdefg');
  expect(Test.__linaria.extends).toBe(Custom);

  const tree = renderer.create(<Test>This is a test</Test>);

  expect(tree.toJSON()).toMatchSnapshot();
});

it('applies CSS variables in style prop', () => {
  const Test = styled('div')({
    name: 'TestComponent',
    class: 'abcdefg',
    vars: {
      foo: ['tomato'],
      bar: [20, 'px'],
      baz: [(props: { size: number }) => props.size, 'px'],
    },
  });

  const tree = renderer.create(<Test size={24}>This is a test</Test>);

  expect(tree.toJSON()).toMatchSnapshot();
});

it('merges CSS variables with custom style prop', () => {
  const Test = styled('div')({
    name: 'TestComponent',
    class: 'abcdefg',
    vars: {
      foo: ['tomato'],
    },
  });

  const tree = renderer.create(
    <Test style={{ bar: 'baz' }}>This is a test</Test>
  );

  expect(tree.toJSON()).toMatchSnapshot();
});

it('supports extra className prop', () => {
  const Test = styled('div')({
    name: 'TestComponent',
    class: 'abcdefg',
  });

  const tree = renderer.create(<Test className="primary">This is a test</Test>);

  expect(tree.toJSON()).toMatchSnapshot();
});

it('supports extra class prop', () => {
  const Test = styled('div')({
    name: 'TestComponent',
    class: 'abcdefg',
  });

  const tree = renderer.create(<Test class="primary">This is a test</Test>);

  expect(tree.toJSON()).toMatchSnapshot();
});

it('replaces simple component with as prop', () => {
  const Test = styled('button')({
    name: 'TestComponent',
    class: 'abcdefg',
  });

  const tree = renderer.create(
    <Test as="a" id="test" foo="bar">
      This is a test
    </Test>
  );

  expect(tree.toJSON()).toMatchSnapshot();
});

it('replaces custom component with as prop for primitive', () => {
  const Custom: React.FC = (props) => (
    <div {...props} style={{ fontSize: 12 }} />
  );

  const Test = styled(Custom)({
    name: 'TestComponent',
    class: 'abcdefg',
  });

  const tree = renderer.create(
    <Test as="a" id="test" foo="bar">
      This is a test
    </Test>
  );

  expect(tree.toJSON()).toMatchSnapshot();
});

it('replaces primitive with as prop for custom component', () => {
  const Custom: React.FC = (props) => (
    <div {...props} style={{ fontSize: 12 }} />
  );

  const Test = styled('div')({
    name: 'TestComponent',
    class: 'abcdefg',
  });

  const tree = renderer.create(
    <Test as={Custom} id="test" foo="bar">
      This is a test
    </Test>
  );

  expect(tree.toJSON()).toMatchSnapshot();
});

it('handles wrapping another styled component', () => {
  const First = styled('div')({
    name: 'FirstComponent',
    class: 'abcdefg',
  });

  const Second = styled(First)({
    name: 'SecondComponent',
    class: 'hijklmn',
  });

  const tree = renderer.create(<Second>This is a test</Second>);

  expect(tree.toJSON()).toMatchSnapshot();
});

it('forwards as prop when wrapping another styled component', () => {
  const First = styled('div')({
    name: 'FirstComponent',
    class: 'abcdefg',
  });

  const Second = styled(First)({
    name: 'SecondComponent',
    class: 'hijklmn',
  });

  const tree = renderer.create(<Second as="a">This is a test</Second>);

  expect(tree.toJSON()).toMatchSnapshot();
});

it('filters unknown html attributes for HTML tag', () => {
  const Test = styled('div')({
    name: 'TestComponent',
    class: 'abcdefg',
  });

  const tree = renderer.create(
    <Test unknownAttribute="voila">This is a test</Test>
  );

  expect(tree.toJSON()).toMatchSnapshot();
});

it('does not filter attributes for kebab cased custom elements', () => {
  const Test = styled('my-element')({
    name: 'TestComponent',
    class: 'abcdefg',
  });

  const tree = renderer.create(
    <Test unknownAttribute="voila">This is a test</Test>
  );

  expect(tree.toJSON()).toMatchSnapshot();
});

it('does not filter attributes for upper camel cased custom elements', () => {
  const Test = styled('View')({
    name: 'TestComponent',
    class: 'abcdefg',
  });

  const tree = renderer.create(<Test hoverClass="voila">This is a test</Test>);

  expect(tree.toJSON()).toMatchSnapshot();
});

it('does not filter attributes for unknown tag', () => {
  const Test = styled('definitelyunknowntag')({
    name: 'TestComponent',
    class: 'abcdefg',
    propsAsIs: true,
  });

  const tree = renderer.create(<Test hoverClass="voila">This is a test</Test>);

  expect(tree.toJSON()).toMatchSnapshot();
});

it('does not filter attributes for components', () => {
  const Custom: React.FC<{ unknownAttribute: string }> = (props) => (
    <div>{props.unknownAttribute}</div>
  );

  const Test = styled(Custom)({
    name: 'TestComponent',
    class: 'abcdefg',
  });

  const tree = renderer.create(
    <Test unknownAttribute="voila">This is a test</Test>
  );

  expect(tree.toJSON()).toMatchSnapshot();
});

it('provides linaria component className for composition as last item in props.className', () => {
  const Custom: React.FC<{ className: string }> = (props) => {
    const classnames = props.className.split(' ');
    const linariaClassName = classnames[classnames.length - 1];
    const newClassNames = [
      props.className,
      `${linariaClassName}--primary`,
      `${linariaClassName}--accessibility`,
    ].join(' ');

    return (
      <div className={newClassNames}>
        original classname used for composition
      </div>
    );
  };

  const Test = styled(Custom)({
    name: 'TestComponent',
    class: 'abcdefg',
  });

  const tree = renderer.create(
    <Test className="some-another-class">This is a test</Test>
  );

  expect(tree.toJSON()).toMatchSnapshot();
});

it('throws when using as tag for template literal', () => {
  // styled uses process.env.NODE_ENV to determine if it's running in a test environment
  const nodeEnv = process.env.NODE_ENV;
  delete process.env.NODE_ENV;

  expect(
    () =>
      styled('div')`
        color: blue;
      `
  ).toThrow('Using the "styled" tag in runtime is not supported');

  expect(
    () =>
      styled.div`
        color: blue;
      `
  ).toThrow('Using the "styled" tag in runtime is not supported');

  process.env.NODE_ENV = nodeEnv;
});

it('can get rest keys from object', () => {
  const obj = { one: 1, two: 2, three: 3 };
  const rest = omit(obj, ['two']);
  // eslint-disable-next-line no-unused-vars
  const { two, ...expectedRest } = obj;
  expect(rest).toEqual(expectedRest);
});
it('can get rest keys from complex object', () => {
  const obj = {
    string: 'hello',
    bool: false,
    object: { hello: 'world' },
    arr: [1, 2, 3],
    num: 47,
  };
  const rest = omit(obj, ['bool', 'object', 'arr']);
  // eslint-disable-next-line no-unused-vars
  const { bool, object, arr, ...expectedRest } = obj;
  expect(rest).toEqual(expectedRest);
});
