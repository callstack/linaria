import * as React from 'react';
import { styled } from '../../../src';
import Title from './Title';
import Button from './Button';
import colors from '../colors.json';

const Container = styled('div')`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: ${colors.background};
`;

const PRIMARY_COLORS = ['#de2d68', '#a32cde', '#4a2cde'];

export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      index: 0,
    };

    this._handleClick = this._handleClick.bind(this);
  }

  _handleClick() {
    this.setState(state => ({
      index: state.index === 2 ? 0 : state.index + 1,
    }));
  }

  render() {
    const color = PRIMARY_COLORS[this.state.index];

    return (
      <Container onClick={this._handleClick}>
        <Title color={color}>Linaria styled</Title>
        <Button
          color={color}
          target="_blank"
          href="https://github.com/satya164/linaria-styled"
        >
          Learn more
        </Button>
      </Container>
    );
  }
}
