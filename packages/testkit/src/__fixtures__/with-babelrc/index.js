import { styled } from '@linaria/react';
import { capitalize } from 'lodash';
import { fooStyles } from '_/re-exports';

const value = capitalize(fooStyles.foo);

export const H1 = styled.h1`
  color: ${value};
`;
