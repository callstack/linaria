import { css } from '@linaria/core';
import { CSRChild, cssVariableFromModule } from './csr_child';
import { astroTextColor } from './external';

// Try to change some variables white in dev mode
const GLOBAL_VARS = {
  color_header: 'red',
} as const;

export default function CSRComponent() {
  const LOCAL_VARS = {
    description_font_style: 'bold',
  } as const;
  return (
    <div>
      <h1>
        Hello! This is{' '}
        <strong
          class={css`
            color: ${GLOBAL_VARS.color_header};
          `}
        >
          Solid
        </strong>{' '}
        app built with{' '}
        <strong
          class={css`
            color: palevioletred;
          `}
        >
          Linaria
        </strong>{' '}
        powered by
        <br />
        <strong
          class={css`
            color: ${astroTextColor};
            font-size: ${cssVariableFromModule};
          `}
        >
          Astro
        </strong>
      </h1>
      <div
        class={css`
          font-style: ${LOCAL_VARS.description_font_style};
        `}
      >
        This component was rendered on client.
      </div>
      <CSRChild />
    </div>
  );
}
