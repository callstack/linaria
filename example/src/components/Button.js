import { styled } from '../../../src';
import colors from '../colors.json';

const Button = styled('a')`
  appearance: none;
  background: none;
  padding: 10px 20px;
  color: ${props => props.color};
  font-size: 1em;
  font-weight: 700;
  text-transform: uppercase;
  text-decoration: none;
  border: 2px solid ${props => props.color};
  border-radius: 3px;
  cursor: pointer;
  transition: color 0.2s, background 0.2s;

  &:hover {
    background: ${props => props.color};
    color: ${colors.background};
  }
`;

export default Button;
