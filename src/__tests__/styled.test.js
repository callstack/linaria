const React = require('react');
const renderer = require('react-test-renderer');
const styled = require('../react/styled').default;

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
  const Custom = (props) => <div {...props} />;

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
      baz: [(props) => props.size, 'px'],
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
  const Custom = (props) => <div {...props} style={{ fontSize: 12 }} />;

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
  const Custom = (props) => <div {...props} style={{ fontSize: 12 }} />;

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

it('does not filter attributes for custom elements', () => {
  const Test = styled('my-element')({
    name: 'TestComponent',
    class: 'abcdefg',
  });

  const tree = renderer.create(
    <Test unknownAttribute="voila">This is a test</Test>
  );

  expect(tree.toJSON()).toMatchSnapshot();
});

it('does not filter attributes for components', () => {
  const Custom = (props) => <div>{props.unknownAttribute}</div>;

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
  const Custom = (props) => {
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
});
