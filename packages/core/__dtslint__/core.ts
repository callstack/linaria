// eslint-disable-next-line import/no-extraneous-dependencies
import { expect } from 'tstyche';

import type { LinariaClassName } from '../src';
import { css, cx } from '../src';

const class1 = css``;
expect(class1).type.toBe<LinariaClassName>();

const activeClass = css``;

expect(cx(class1, 'active')).type.toBe<string>();

expect(cx(class1, activeClass)).type.toBe<LinariaClassName>();
