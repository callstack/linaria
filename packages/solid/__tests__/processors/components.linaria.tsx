import { styled } from '../../src';

interface TagProps {
  readonly bg?: string;
}
export const Tag = styled.div<TagProps>`
  color: red;
  background: ${(props) => props.bg};
`;
