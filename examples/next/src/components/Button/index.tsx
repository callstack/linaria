import { ReactNode } from 'react';
import { ButtonContainer, blackBackground } from './styles';

interface ButtonProps {
  children: ReactNode;
}

export function Button({ children }: ButtonProps) {
  return (
    <ButtonContainer href="https://linaria.dev/" className={blackBackground}>
      <h2>{children}</h2>
    </ButtonContainer>
  );
}
