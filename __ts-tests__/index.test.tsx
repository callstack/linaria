/* eslint-disable import/no-unresolved */
// eslint-disable-next-line import/no-extraneous-dependencies
import { css, cx } from 'linaria';

const tomato = 'tomato';
const border = 1;

const absoluteFill = {
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
};

// $ExpectType string
css`
  color: ${tomato};
  border-width: ${border}px;

  &.abs {
    ${absoluteFill};
  }
`;

// $ExpectType string
css`
  font-family: sans-serif;
`;

// $ExpectError
css`
  color: ${true};
`;

// $ExpectError
css`
  color: ${undefined};
`;

// $ExpectError
css`
  color: ${null};
`;

// $ExpectType string
cx('test', false, undefined, null, 0);

// $ExpectError
cx('test', 42);

// $ExpectError
cx('test', true);

// $ExpectError
cx('test', {});
