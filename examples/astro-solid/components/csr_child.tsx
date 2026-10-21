import { css } from '@linaria/core';
import { astroTextColor } from './external';

export function CSRChild() {
  return (
    <div
      class={css`
        float: right;
        color: ${astroTextColor};
      `}
    >
      I am child module!
    </div>
  );
}
// Try to change some variables white in dev mode
export const cssVariableFromModule = '64px';
