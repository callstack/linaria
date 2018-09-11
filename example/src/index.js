import * as React from 'react';
import ReactDOM from 'react-dom';
import component from '../../src/component';

const background = 'yellow';

const Title = styled('h1')``;

const Container = styled('div')`
  background-color: ${background};
  color: ${props => props.color};
  width: ${100 / 3}%;
  border: 1px solid red;

  &:hover {
    border-color: blue;
  }
`;

console.log(<Title>Hello sweetie</Title>);

ReactDOM.render(
  <Container color="orange">
    <Title>Hello sweetie</Title>
  </Container>,
  document.getElementById('root')
);
