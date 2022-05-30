import { css } from '@linaria/core';
import { css as atomicCss } from '@linaria/atomic';

export const Page = css`
  background: linear-gradient(to bottom right, #b24592, #f15f79);
  color: #fff;
  min-height: 100vh;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.08);
`;

export const AtomicPage = atomicCss`
  background: linear-gradient(to bottom right, #b24592, #f15f79);
  color: #fff;
  min-height: 100vh;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.08);
`;
