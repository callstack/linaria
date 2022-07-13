import { styled } from '@linaria/react';
import { fooStyles } from "_/re-exports";

const value = fooStyles.foo;

export const H1 = styled.h1`
  color: ${value};
`;
