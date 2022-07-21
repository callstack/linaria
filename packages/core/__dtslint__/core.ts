/* eslint-disable @typescript-eslint/no-unused-vars */
import { css, cx } from '../src';

// $ExpectType LinariaClassName
const class1 = css``;

const activeClass = css``;

// $ExpectType string
const combined1 = cx(class1, 'active');

// $ExpectType LinariaClassName
const combined2 = cx(class1, activeClass);
