import { styled } from '../../../src';

const TEXT_SHADOW_COLOR = '#ffebce';

const Title = styled('h1')`
  text-transform: uppercase;
  font-size: 48px;
  font-weight: bold;
  color: ${props => props.color};
  text-shadow: 0 0 ${TEXT_SHADOW_COLOR}, 1px 1px ${TEXT_SHADOW_COLOR},
    2px 2px ${TEXT_SHADOW_COLOR}, 3px 3px ${TEXT_SHADOW_COLOR},
    4px 4px ${TEXT_SHADOW_COLOR}, 5px 5px ${TEXT_SHADOW_COLOR};
  margin: 24px;
`;

export default Title;
