import { styled } from '../../src';

interface TagProps {
  readonly background?: string;
}
export const Tag = styled.div<TagProps>`
  color: red;
  background: ${(props) => props.background};
`;
