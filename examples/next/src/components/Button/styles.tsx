import { styled } from 'linaria/react';
import { css } from 'linaria';

export const ButtonContainer = styled.a`
  margin: 1rem;
  cursor: pointer;
  padding: 1.5rem 3rem;
  text-align: center;
  color: inherit;
  text-decoration: none;
  border: 1px solid #fff;
  border-radius: 10px;
  transition: color 0.15s ease, background-color 0.15s ease;
  max-width: 600px;

  h2 {
    font-size: 1.5rem;
  }

  &:hover,
  &:focus,
  &:active {
    background-color: #63a355;
    border-color: #63a355;
  }

  @media (prefers-color-scheme: dark) {
    border-color: #222;
  }
`;

export const blackBackground = css`
  background-color: #000;
`;
