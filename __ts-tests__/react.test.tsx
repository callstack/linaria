/* eslint-disable import/no-unresolved */

import * as React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { styled } from 'linaria/react';

const white = 'white';
const tomato = 'tomato';
const border = 1;

const absoluteFill = {
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
};

const Button = styled.button`
  color: ${white};
  border-width: ${border}px;

  &.abs {
    ${absoluteFill};
  }
`;

const ColoredButton = styled.button<{ background: string; children: string }>`
  background-color: ${(props) => props.background};
`;

const CustomButton = styled(Button)`
  &:hover {
    background-color: ${tomato};
  }
`;

class Title extends React.Component<{ label: string; className?: string }> {
  render() {
    return <h1 className={this.props.className}>{this.props.label}</h1>;
  }
}

const CustomTitle = styled(Title)`
  font-family: sans-serif;
`;

// $Expect Element
<Button as="a">Hello world</Button>;

// $Expect Element
<ColoredButton background="blue">Hello world</ColoredButton>;

// $ExpectError
<ColoredButton background={42}>Hello world</ColoredButton>;

// $ExpectError
<Button onClick={42}>Hello world</Button>;

// $Expect Element
<CustomButton onClick={() => alert('Clicked')}>Hello world</CustomButton>;

// $Expect Element
<CustomTitle label="Hello world" />;

// $Expect Element
<CustomTitle label="Hello world" className="primary" />;

// $ExpectError
<CustomTitle />;
